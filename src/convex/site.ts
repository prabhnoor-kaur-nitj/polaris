// Public site endpoints with row-level security (RLS).
//
// RLS model, enforced per endpoint:
// - `submitContact`: PUBLIC write-only. Anyone (including signed-out visitors)
//   may INSERT one row. No document is ever returned, and no read of other
//   rows is possible.
// - `listContactMessages` / `dismissContactMessage`: MASTER-ONLY. Every access
//   path first verifies the caller's role === "master" and returns null /
//   throws otherwise — the dashboard UI hides the panel for non-masters, and
//   the server rejects direct API calls too.

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { ROLES } from "./schema";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------- public insert-only writes ------------------------- */

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

/* --------------------------- master-only read paths --------------------------- */

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

/** Row deletes, separated out because actions cannot touch ctx.db directly. */
export const deleteMessageRow = internalMutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

/* ------------------------------ master-only actions ----------------------------- */

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
