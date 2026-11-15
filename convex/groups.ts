import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { addAvatar, randomCode } from "./lib";

const LOOKS = [
  { color: "#7DB7F0", icon: "sparkles" },
  { color: "#FF9EB5", icon: "heart" },
  { color: "#8FE0B0", icon: "leaf" },
  { color: "#FFD27A", icon: "sunny" },
  { color: "#C6A8FF", icon: "moon" },
  { color: "#FF9B7A", icon: "flame" },
];

export const create = mutation({
  args: { name: v.string(), userId: v.id("users") },
  handler: async (ctx, { name, userId }) => {
    let inviteCode = randomCode();
    while (await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", inviteCode)).unique()) {
      inviteCode = randomCode();
    }
    const look = LOOKS[Math.floor(Math.random() * LOOKS.length)];
    const groupId = await ctx.db.insert("groups", { name: name.trim().slice(0, 40), inviteCode, createdBy: userId, ...look });
    await ctx.db.insert("groupMembers", { groupId, userId });
    return groupId;
  },
});

export const join = mutation({
  args: { inviteCode: v.string(), userId: v.id("users") },
  handler: async (ctx, { inviteCode, userId }) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite", (q) => q.eq("inviteCode", inviteCode.trim().toUpperCase()))
      .unique();
    if (!group) throw new Error("No group with that code");
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => q.eq("groupId", group._id).eq("userId", userId))
      .unique();
    if (!existing) {
      await ctx.db.insert("groupMembers", { groupId: group._id, userId });
      if (group.demo) await ctx.scheduler.runAfter(0, internal.demo.backfillUser, { groupId: group._id, userId });
    }
    return group._id;
  },
});

export const mine = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db.query("groupMembers").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const groups = await Promise.all(
      memberships.map(async (m) => {
        const group = await ctx.db.get(m.groupId);
        if (!group) return null;
        const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
        const active = await ctx.db
          .query("days")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();
        return { ...group, memberCount: members.length, activeDay: active };
      }),
    );
    return groups.filter((g) => g !== null);
  },
});

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const group = await ctx.db.get(groupId);
    if (!group) return null;
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const users = await Promise.all(members.map(async (m) => addAvatar(ctx, await ctx.db.get(m.userId))));
    const activeDay = await ctx.db
      .query("days")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    return { ...group, members: users.filter((u) => u !== null), activeDay };
  },
});
