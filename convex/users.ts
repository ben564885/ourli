import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { addAvatar } from "./lib";

const COLORS = ["#7C83FD", "#FF8FAB", "#FFB86B", "#5EE6A8", "#6BC5FF", "#C38BFF", "#FFD166"];

export const create = mutation({
  args: { name: v.string(), avatarId: v.optional(v.id("_storage")) },
  handler: async (ctx, { name, avatarId }) => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return await ctx.db.insert("users", { name: name.trim().slice(0, 32), color, avatarId });
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => addAvatar(ctx, await ctx.db.get(userId)),
});

export const rename = mutation({
  args: { userId: v.id("users"), name: v.string() },
  handler: async (ctx, { userId, name }) => {
    await ctx.db.patch(userId, { name: name.trim().slice(0, 32) });
  },
});
