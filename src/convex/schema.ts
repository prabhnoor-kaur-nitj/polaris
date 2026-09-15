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

    // Public marketing-site endpoints (insert-only from the landing site;
    // reads are master-only, enforced in src/convex/site.ts).
    waitlist: defineTable({
      email: v.string(),
      org: v.optional(v.string()),
      station: v.optional(v.string()),
      createdAt: v.number(),
    }).index("email", ["email"]),

    contactMessages: defineTable({
      name: v.string(),
      email: v.string(),
      subject: v.string(),
      message: v.string(),
      createdAt: v.number(),
    }).index("email", ["email"]),

    // Anonymous site analytics: one row per page view.
    pageviews: defineTable({
      path: v.string(),
      referrer: v.optional(v.string()),
      at: v.number(),
    })
      .index("by_path", ["path"])
      .index("by_at", ["at"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
