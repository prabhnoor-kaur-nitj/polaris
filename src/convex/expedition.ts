// POLARIS expedition backend. This is the real sync target for the offline-first
// field store: every event the client queues while offline is flushed here via
// these mutations once connectivity returns.
//
// RLS: only provisioned portal users (master / admin / member — anyone who has
// been granted access by the master) may write or read expedition data. The
// signed-out public sees nothing. Field telemetry is operational data, so all
// portal roles can write; the master additionally gets a live feed.

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { ROLES } from "./schema";

const PORTAL_ROLES = [ROLES.MASTER, ROLES.ADMIN, ROLES.MEMBER];

type QueryCtx = GenericQueryCtx<DataModel>;

/** RLS gate: only provisioned portal users may touch expedition data. */
async function requirePortalUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("UNAUTHENTICATED: portal access required");
  const user = await ctx.db.get(userId);
  if (!user?.role || !PORTAL_ROLES.includes(user.role as (typeof PORTAL_ROLES)[number])) {
    throw new Error("FORBIDDEN: no expedition access granted");
  }
  return { userId, user };
}

const geoValidator = v.object({
  lat: v.number(), // decimal degrees, negative = south
  lon: v.number(), // decimal degrees, negative = west
});

/** Log a cargo movement (incoming/outgoing stock movement at a station). */
export const logCargo = mutation({
  args: {
    itemId: v.string(),
    itemName: v.string(),
    kind: v.union(v.literal("OUTGOING"), v.literal("INCOMING")),
    qty: v.number(),
    note: v.string(),
    at: v.number(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    return await ctx.db.insert("cargoLog", { ...args, userId });
  },
});

/** Record a field status change for a crew member (ACTIVE/STANDBY/REST/DISTRESS). */
export const setPersonnelStatus = mutation({
  args: {
    personnelId: v.string(),
    callsign: v.string(),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("STANDBY"),
      v.literal("REST"),
      v.literal("DISTRESS"),
    ),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    return await ctx.db.insert("personnelStatus", { ...args, userId });
  },
});

/** Record an asset position fix — the ground truth of a field GPS/RFID report. */
export const recordAssetPosition = mutation({
  args: {
    assetKind: v.union(
      v.literal("personnel"),
      v.literal("vehicle"),
      v.literal("beacon"),
    ),
    assetId: v.string(),
    label: v.string(),
    pos: geoValidator,
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    const { pos, ...rest } = args;
    return await ctx.db.insert("assetPositions", { ...rest, ...pos, userId });
  },
});

/** Register a new tracked asset in the fleet registry (idempotent upsert). */
export const registerAsset = mutation({
  args: {
    kind: v.union(v.literal("personnel"), v.literal("vehicle"), v.literal("beacon")),
    assetId: v.string(),
    name: v.string(),
    meta: v.optional(v.string()),
    pos: geoValidator,
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    const existing = await ctx.db
      .query("trackedAssets")
      .withIndex("by_asset", (q) => q.eq("kind", args.kind).eq("assetId", args.assetId))
      .unique();
    const row = {
      userId,
      kind: args.kind,
      assetId: args.assetId,
      name: args.name,
      meta: args.meta,
      retired: false,
      lat: args.pos.lat,
      lon: args.pos.lon,
      at: args.at,
    };
    if (existing) {
      await ctx.db.patch(existing._id, row);
      return existing._id;
    }
    return await ctx.db.insert("trackedAssets", row);
  },
});

/** Retire a tracked asset (recovered crew member, lost beacon, scrapped vehicle). */
export const retireAsset = mutation({
  args: {
    kind: v.union(v.literal("personnel"), v.literal("vehicle"), v.literal("beacon")),
    assetId: v.string(),
    name: v.string(),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    const existing = await ctx.db
      .query("trackedAssets")
      .withIndex("by_asset", (q) => q.eq("kind", args.kind).eq("assetId", args.assetId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { retired: true, at: args.at });
      return existing._id;
    }
    return await ctx.db.insert("trackedAssets", {
      userId,
      kind: args.kind,
      assetId: args.assetId,
      name: args.name,
      retired: true,
      lat: 0,
      lon: 0,
      at: args.at,
    });
  },
});

/** Persist a planned traverse route. */
export const saveRoute = mutation({
  args: {
    name: v.string(),
    waypoints: v.array(
      v.object({
        kind: v.union(v.literal("STATION"), v.literal("SUPPLY_NODE"), v.literal("CUSTOM")),
        refId: v.optional(v.string()),
        label: v.string(),
        pos: geoValidator,
      }),
    ),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    const { waypoints, ...rest } = args;
    return await ctx.db.insert(
      "routes",
      {
        ...rest,
        waypoints: waypoints.map(({ pos, ...wp }) => ({ ...wp, ...pos })),
        userId,
      },
    );
  },
});

/** SOS beacon: raised or resolved. Resolved events close out their incident. */
export const reportSos = mutation({
  args: {
    personnelId: v.string(),
    callsign: v.string(),
    pos: geoValidator,
    resolved: v.boolean(),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    const { pos, ...rest } = args;
    return await ctx.db.insert("sosIncidents", { ...rest, ...pos, userId });
  },
});

/** Flush an offline event that has no dedicated mutation (idempotent by clientId). */
export const pushEvent = mutation({
  args: {
    clientId: v.string(),
    kind: v.string(),
    label: v.string(),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePortalUser(ctx);
    const existing = await ctx.db
      .query("syncEvents")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();
    if (existing) return existing._id; // already flushed on a previous attempt
    return await ctx.db.insert("syncEvents", { ...args, userId });
  },
});

/** Live expedition feed for the command deck (portal roles only). */
export const getFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 80 }) => {
    await requirePortalUser(ctx);
    const clamped = Math.max(1, Math.min(200, limit));
    const [cargo, statuses, positions, routes, sos, registry] = await Promise.all([
      ctx.db.query("cargoLog").order("desc").take(clamped),
      ctx.db.query("personnelStatus").order("desc").take(clamped),
      ctx.db.query("assetPositions").order("desc").take(clamped),
      ctx.db.query("routes").order("desc").take(clamped),
      ctx.db.query("sosIncidents").order("desc").take(clamped),
      ctx.db.query("trackedAssets").order("desc").take(clamped),
    ]);
    const feed = [
      ...cargo.map((d) => ({
        _id: d._id,
        kind: "CARGO_LOG" as const,
        label: `${d.kind === "INCOMING" ? "+" : "−"}${d.qty} · ${d.itemName}`,
        at: d.at,
      })),
      ...statuses.map((d) => ({
        _id: d._id,
        kind: "STATUS" as const,
        label: `${d.callsign} → ${d.status}`,
        at: d.at,
      })),
      ...positions.map((d) => ({
        _id: d._id,
        kind: "ASSET_MOVE" as const,
        label: `${d.label} position fix`,
        at: d.at,
      })),
      ...routes.map((d) => ({
        _id: d._id,
        kind: "ROUTE" as const,
        label: `Route planned · ${d.name}`,
        at: d.at,
      })),
      ...registry.map((d) => ({
        _id: d._id,
        kind: (d.retired ? "ASSET_REMOVE" : "ASSET_ADD") as "ASSET_REMOVE" | "ASSET_ADD",
        label: `${d.retired ? "Retired" : "Registered"} · ${d.name}`,
        at: d.at,
      })),
      ...sos.map((d) => ({
        _id: d._id,
        kind: (d.resolved ? "SOS_RESOLVED" : "SOS") as "SOS_RESOLVED" | "SOS",
        label: `${d.resolved ? "Resolved" : "MAYDAY"} · ${d.callsign}`,
        at: d.at,
      })),
    ];
    return feed.sort((a, b) => b.at - a.at).slice(0, clamped);
  },
});
