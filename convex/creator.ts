import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const joinDemo = mutation({
  args: { dayId: v.id("days"), userId: v.id("users") },
  handler: async (ctx, { dayId, userId }) => {
    const existing = await ctx.db
      .query("creatorDayFans")
      .withIndex("by_day_user", (q) => q.eq("dayId", dayId).eq("userId", userId))
      .unique();
    if (!existing) await ctx.db.insert("creatorDayFans", { dayId, userId, verifiedAt: Date.now(), method: "demo" });
  },
});

export const membership = query({
  args: { dayId: v.id("days"), userId: v.id("users") },
  handler: async (ctx, { dayId, userId }) =>
    ctx.db
      .query("creatorDayFans")
      .withIndex("by_day_user", (q) => q.eq("dayId", dayId).eq("userId", userId))
      .unique(),
});

export const whopConfigured = query({
  args: {},
  handler: async () => ({
    configured: !!(process.env.WHOP_CLIENT_ID && process.env.WHOP_API_KEY),
    productId: process.env.WHOP_PRODUCT_ID ?? null,
  }),
});

export const saveState = internalMutation({
  args: { state: v.string(), codeVerifier: v.string(), dayId: v.id("days"), userId: v.id("users"), returnTo: v.string() },
  handler: async (ctx, a) => {
    await ctx.db.insert("oauthStates", a);
  },
});

export const takeState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const row = await ctx.db.query("oauthStates").withIndex("by_state", (q) => q.eq("state", state)).unique();
    if (row) await ctx.db.delete(row._id);
    return row;
  },
});

export const getDay = internalQuery({
  args: { dayId: v.id("days") },
  handler: async (ctx, { dayId }) => ctx.db.get(dayId),
});

export const addVerifiedFan = internalMutation({
  args: { dayId: v.id("days"), userId: v.id("users"), whopUserId: v.string() },
  handler: async (ctx, { dayId, userId, whopUserId }) => {
    const existing = await ctx.db
      .query("creatorDayFans")
      .withIndex("by_day_user", (q) => q.eq("dayId", dayId).eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { whopUserId, method: "whop", verifiedAt: Date.now() });
      return;
    }
    await ctx.db.insert("creatorDayFans", { dayId, userId, whopUserId, verifiedAt: Date.now(), method: "whop" });
  },
});
