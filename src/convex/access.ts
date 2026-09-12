// Portal access control. Access to the command portal is granted exclusively by
// the master (station commander). There is no self sign-up and no guest access:
// the first master bootstraps the system, then every further account must be
// created by the master via createCrewAccount.

import { createAccount, getAuthUserId, invalidateSessions } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { ROLES } from "./schema";

const PASSWORD_PROVIDER = "password";
const RESERVE_MASTER_EMAIL = "master@ncpor.gov.in";

const GRANTABLE = v.union(v.literal(ROLES.MEMBER), v.literal(ROLES.USER), v.literal(ROLES.ADMIN));

/* ------------------------------ queries ------------------------------ */

/** Whether the master account has been provisioned yet. Public by design:
 *  the auth page needs this to decide between bootstrap and sign-in mode. */
export const hasMaster = query({
  args: {},
  handler: async (ctx) => {
    const master = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", RESERVE_MASTER_EMAIL))
      .unique();
    if (master?.role === ROLES.MASTER) return true;
    const anyMaster = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.MASTER))
      .first();
    return anyMaster !== null;
  },
});

/** Directory of provisioned accounts, for the master's access-control panel. */
export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (me?.role !== ROLES.MASTER) return null;
    const rows = await ctx.db.query("users").collect();
    return rows
      .map((u) => ({
        id: u._id,
        email: u.email ?? "(unknown)",
        name: u.name ?? null,
        role: u.role ?? null,
        isMaster: u.role === ROLES.MASTER,
      }))
      .sort((a, b) => {
        if (a.isMaster !== b.isMaster) return a.isMaster ? -1 : 1;
        return a.email.localeCompare(b.email);
      });
  },
});

/* --------------------------- internal helpers --------------------------- */

/** Role lookup for use inside actions (actions cannot touch ctx.db directly). */
export const getRoleOf = internalQuery({
  args: { userId: v.union(v.id("users"), v.null()) },
  handler: async (ctx, { userId }) => {
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    return user?.role ?? null;
  },
});

export const masterExists = internalQuery({
  args: {},
  handler: async (ctx) => {
    const anyMaster = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.MASTER))
      .first();
    return anyMaster !== null;
  },
});

/** Patch a user's role. Returns whether the role actually changed. */
export const patchRole = internalMutation({
  args: { userId: v.id("users"), role: GRANTABLE },
  handler: async (ctx, { userId, role }) => {
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found.");
    if (target.email === RESERVE_MASTER_EMAIL) {
      throw new Error("The master account role cannot be changed.");
    }
    const changed = (target.role ?? null) !== role;
    if (changed) await ctx.db.patch(userId, { role });
    return { changed };
  },
});

/** Delete a crew member's auth accounts, sessions and user document. */
export const deleteUserDocs = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    for (const account of await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect()) {
      await ctx.db.delete(account._id);
    }
    for (const session of await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect()) {
      await ctx.db.delete(session._id);
    }
    await ctx.db.delete(userId);
  },
});

/* ----------------------------- actions ----------------------------- */

/** One-time system bootstrap: claims the master seat for the first commander.
 *  Every bootstrap attempt provisions the same reserved master identifier, and
 *  createAccount throws when that account already exists — so no race can ever
 *  produce two masters. */
export const bootstrapMaster = action({
  args: { email: v.string(), name: v.string(), password: v.string() },
  handler: async (ctx, { email, name, password }) => {
    if (await ctx.runQuery(internal.access.masterExists, {})) {
      throw new Error("MASTER_EXISTS");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    await createAccount(ctx, {
      provider: PASSWORD_PROVIDER,
      account: { id: RESERVE_MASTER_EMAIL, secret: password },
      profile: { email: RESERVE_MASTER_EMAIL, name: name.trim() || "Station Commander", role: ROLES.MASTER },
    });
    return { success: true as const };
  },
});

/** Master-only: provision a crew account with a password. Accounts are created
 *  with a role immediately; only the master can create them, so the set of
 *  portal users stays exactly the set the master granted. */
export const createCrewAccount = action({
  args: { email: v.string(), name: v.string(), password: v.string(), role: GRANTABLE },
  handler: async (ctx, { email, name, password, role }) => {
    const userId = await getAuthUserId(ctx);
    const callerRole = await ctx.runQuery(internal.access.getRoleOf, { userId });
    if (callerRole !== ROLES.MASTER) {
      throw new Error("FORBIDDEN: only the master can grant portal access");
    }
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error("Enter a valid email address.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    if (normalized === RESERVE_MASTER_EMAIL) {
      throw new Error("That identifier is reserved for the master account.");
    }
    await createAccount(ctx, {
      provider: PASSWORD_PROVIDER,
      account: { id: normalized, secret: password },
      profile: { email: normalized, name: name.trim() || normalized, role },
    });
    return { success: true as const };
  },
});

/** Master-only: grant or change a crew member's role. A role change also kills
 *  the member's live sessions so stale sessions cannot outlive their access. */
export const setUserRole = action({
  args: { userId: v.id("users"), role: GRANTABLE },
  handler: async (ctx, { userId, role }) => {
    const callerId = await getAuthUserId(ctx);
    const callerRole = await ctx.runQuery(internal.access.getRoleOf, { userId: callerId });
    if (callerRole !== ROLES.MASTER) {
      throw new Error("FORBIDDEN: master access required");
    }
    const result = await ctx.runMutation(internal.access.patchRole, { userId, role });
    if (result.changed) {
      await invalidateSessions(ctx, { userId });
    }
    return { success: true as const };
  },
});

/** Master-only: fully remove a crew member — live sessions, auth account and
 *  user document. The master seat itself can never be deleted. */
export const deleteCrewAccount = action({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const callerId = await getAuthUserId(ctx);
    const callerRole = await ctx.runQuery(internal.access.getRoleOf, { userId: callerId });
    if (callerRole !== ROLES.MASTER) {
      throw new Error("FORBIDDEN: master access required");
    }
    if (callerId !== null && userId === callerId) {
      throw new Error("The master cannot delete their own account.");
    }
    const targetRole = await ctx.runQuery(internal.access.getRoleOf, { userId });
    if (targetRole === ROLES.MASTER) {
      throw new Error("The master account cannot be deleted.");
    }
    // Kill live sessions first while they still exist, then remove the docs.
    await invalidateSessions(ctx, { userId });
    await ctx.runMutation(internal.access.deleteUserDocs, { userId });
    return { success: true as const };
  },
});
