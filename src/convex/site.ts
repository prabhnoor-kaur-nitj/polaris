// Public marketing-site endpoints with row-level security (RLS).
//
// RLS model, enforced per endpoint:
// - `joinWaitlist`, `submitContact`, `trackPageview`: PUBLIC write-only. Anyone
//   (including signed-out visitors) may INSERT one row. No document is ever
//   returned, and no read of other rows is possible.
// - `analyticsSummary`, `listWaitlist`, `listContactMessages`: MASTER-ONLY
//   reads. Every read path first verifies the caller's role === "master" and
//   returns null / throws otherwise — the dashboard UI hides the panel for
//   non-masters, and the server rejects direct API calls too.
// - `checkWaitlist`: PUBLIC, but returns only a boolean about the caller's own
//   submitted email — never exposes other visitors' data.

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { ROLES } from "./schema";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------- public insert-only writes ------------------------- */

/** PUBLIC (RLS: insert-only). Join the POLARIS deployment waitlist. */
export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    org: v.optional(v.string()),
    station: v.optional(v.string()),
  },
  handler: async (ctx, { email, org, station }) => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_OK.test(normalized)) {
      throw new Error("Enter a valid email address.");
    }
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    if (existing) {
      return { duplicate: true as const };
    }
    await ctx.db.insert("waitlist", {
      email: normalized,
      org: org?.trim() || undefined,
      station: station?.trim() || undefined,
      createdAt: Date.now(),
    });
    return { duplicate: false as const };
  },
});

/** PUBLIC (RLS: insert-only). File a contact message. */
export const submitContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { name, email, subject, message }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_OK.test(normalizedEmail)) {
      throw new Error("Enter a valid email address.");
    }
    const cleanName = name.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanName || !cleanSubject || !cleanMessage) {
      throw new Error("All fields are required.");
    }
    if (cleanMessage.length > 4000) {
      throw new Error("Message is too long (4000 character limit).");
    }
    await ctx.db.insert("contactMessages", {
      name: cleanName,
      email: normalizedEmail,
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: Date.now(),
    });
    return { success: true as const };
  },
});

/** PUBLIC (RLS: insert-only). Anonymous page-view beacon. */
export const trackPageview = mutation({
  args: { path: v.string(), referrer: v.optional(v.string()) },
  handler: async (ctx, { path, referrer }) => {
    if (!path.startsWith("/")) return { ok: false as const };
    await ctx.db.insert("pageviews", {
      path,
      referrer: referrer || undefined,
      at: Date.now(),
    });
    return { ok: true as const };
  },
});

/** PUBLIC. Returns only whether THIS email is already on the waitlist. */
export const checkWaitlist = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_OK.test(normalized)) return { joined: false as const };
    const row = await ctx.db
      .query("waitlist")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    return { joined: row !== null };
  },
});

/* --------------------- internal helpers for master actions -------------------- */

/** Role lookup usable from actions (actions cannot touch ctx.db directly). */
export const getRoleOf = internalQuery({
  args: { userId: v.union(v.id("users"), v.null()) },
  handler: async (ctx, { userId }) => {
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    return user?.role ?? null;
  },
});

/* --------------------------- master-only read paths --------------------------- */

/** MASTER-ONLY (RLS enforced). Aggregate site analytics for the command deck. */
export const analyticsSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (me?.role !== ROLES.MASTER) return null;

    const views = await ctx.db.query("pageviews").collect();
    const waitlist = await ctx.db.query("waitlist").collect();
    const messages = await ctx.db.query("contactMessages").collect();

    const byPath = new Map<string, number>();
    for (const v of views) byPath.set(v.path, (byPath.get(v.path) ?? 0) + 1);
    const topPaths = [...byPath.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const DAY = 24 * 60 * 60 * 1000;
    const dayStart = (offset: number) => {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime() - offset * DAY;
    };
    const daily: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = dayStart(i);
      daily.push({
        label: new Date(start).toISOString().slice(5, 10),
        count: views.filter((v) => v.at >= start && v.at < start + DAY).length,
      });
    }

    return {
      totalViews: views.length,
      viewsLast24h: views.filter((v) => v.at >= Date.now() - DAY).length,
      waitlistCount: waitlist.length,
      messageCount: messages.length,
      topPaths,
      daily,
    };
  },
});

/** MASTER-ONLY (RLS enforced). Waitlist directory. */
export const listWaitlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (me?.role !== ROLES.MASTER) return null;
    const rows = await ctx.db.query("waitlist").collect();
    return rows
      .map((r) => ({
        id: r._id,
        email: r.email,
        org: r.org ?? null,
        station: r.station ?? null,
        createdAt: r.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** MASTER-ONLY (RLS enforced). Inbox of contact messages. */
export const listContactMessages = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (me?.role !== ROLES.MASTER) return null;
    const rows = await ctx.db.query("contactMessages").collect();
    return rows
      .map((r) => ({
        id: r._id,
        name: r.name,
        email: r.email,
        subject: r.subject,
        message: r.message,
        createdAt: r.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/* ------------------------------ master-only actions ----------------------------- */

/** Row deletes, separated out because actions cannot touch ctx.db directly. */
export const deleteWaitlistRow = internalMutation({
  args: { id: v.id("waitlist") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const deleteMessageRow = internalMutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

/** MASTER-ONLY (RLS enforced). Remove a waitlist entry. */
export const removeWaitlistEntry = action({
  args: { id: v.id("waitlist") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    const callerRole = await ctx.runQuery(internal.site.getRoleOf, { userId });
    if (callerRole !== ROLES.MASTER) {
      throw new Error("FORBIDDEN: master access required");
    }
    await ctx.runMutation(internal.site.deleteWaitlistRow, { id });
    return { success: true as const };
  },
});

/** MASTER-ONLY (RLS enforced). Delete a contact message after handling. */
export const dismissContactMessage = action({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    const callerRole = await ctx.runQuery(internal.site.getRoleOf, { userId });
    if (callerRole !== ROLES.MASTER) {
      throw new Error("FORBIDDEN: master access required");
    }
    await ctx.runMutation(internal.site.deleteMessageRow, { id });
    return { success: true as const };
  },
});
