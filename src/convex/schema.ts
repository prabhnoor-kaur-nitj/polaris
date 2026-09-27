import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  /** Sole account allowed to provision portal access for crew. */
  MASTER: "master",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.MASTER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    // tableName: defineTable({
    //   ...
    //   // table fields
    // }).index("by_field", ["field"])

    // Public marketing-site endpoint (insert-only from the contact page;
    // reads are master-only, enforced in src/convex/site.ts).
    contactMessages: defineTable({
      name: v.string(),
      email: v.string(),
      subject: v.string(),
      message: v.string(),
      createdAt: v.number(),
    }).index("email", ["email"]),

    // ---- POLARIS expedition sync (see src/convex/expedition.ts) ----
    // Server-side ground truth for the offline-first field store. Rows are
    // written only by provisioned portal users (RLS enforced in
    // expedition.ts) and carry the client timestamp `at` so the feed orders
    // by when events happened in the field, not when they arrived.
    cargoLog: defineTable({
      userId: v.id("users"),
      itemId: v.string(),
      itemName: v.string(),
      kind: v.union(v.literal("OUTGOING"), v.literal("INCOMING")),
      qty: v.number(),
      note: v.string(),
      at: v.number(),
      clientId: v.string(), // idempotency key from the field device
    }).index("at", ["at"]),
    personnelStatus: defineTable({
      userId: v.id("users"),
      personnelId: v.string(),
      callsign: v.string(),
      status: v.union(
        v.literal("ACTIVE"),
        v.literal("STANDBY"),
        v.literal("REST"),
        v.literal("DISTRESS"),
      ),
      at: v.number(),
    }).index("at", ["at"]),
    assetPositions: defineTable({
      userId: v.id("users"),
      assetKind: v.union(v.literal("personnel"), v.literal("vehicle")),
      assetId: v.string(),
      label: v.string(),
      lat: v.number(),
      lon: v.number(),
      at: v.number(),
    }).index("at", ["at"]),
    routes: defineTable({
      userId: v.id("users"),
      name: v.string(),
      waypoints: v.array(
        v.object({
          kind: v.union(
            v.literal("STATION"),
            v.literal("SUPPLY_NODE"),
            v.literal("CUSTOM"),
          ),
          refId: v.optional(v.string()),
          label: v.string(),
          lat: v.number(),
          lon: v.number(),
        }),
      ),
      at: v.number(),
    }).index("at", ["at"]),
    sosIncidents: defineTable({
      userId: v.id("users"),
      personnelId: v.string(),
      callsign: v.string(),
      lat: v.number(),
      lon: v.number(),
      resolved: v.boolean(),
      at: v.number(),
    }).index("at", ["at"]),
    syncEvents: defineTable({
      userId: v.id("users"),
      kind: v.string(),
      label: v.string(),
      at: v.number(),
      clientId: v.string(),
    })
      .index("by_clientId", ["clientId"])
      .index("at", ["at"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
