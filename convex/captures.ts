import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { canAccessDay, participants } from "./lib";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const create = mutation({
  args: {
    dayId: v.id("days"),
    userId: v.id("users"),
    hourIndex: v.number(),
    storageId: v.id("_storage"),
    thumbId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, a) => {
    const day = await ctx.db.get(a.dayId);
    if (!day) throw new Error("Day not found");
    if (!(await canAccessDay(ctx, day, a.userId))) throw new Error("Not part of this Day");
    if (a.hourIndex < 0 || a.hourIndex >= day.hourCount) throw new Error("That hour is outside this Day");
    const existing = await ctx.db
      .query("captures")
      .withIndex("by_day_user_hour", (q) => q.eq("dayId", a.dayId).eq("userId", a.userId).eq("hourIndex", a.hourIndex))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { storageId: a.storageId, thumbId: a.thumbId, takenAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("captures", { ...a, takenAt: Date.now() });
  },
});

export const byHour = query({
  args: { dayId: v.id("days"), hourIndex: v.number(), userId: v.id("users"), tick: v.optional(v.number()) },
  handler: async (ctx, { dayId, hourIndex, userId }) => {
    const day = await ctx.db.get(dayId);
    if (!day || !(await canAccessDay(ctx, day, userId))) return null;
    let users = await participants(ctx, day);
    if (day.type === "creator" && day.creatorId !== userId) {
      users = users.filter((u) => u._id === day.creatorId || u._id === userId);
    }
    const caps = await ctx.db
      .query("captures")
      .withIndex("by_day_hour", (q) => q.eq("dayId", dayId).eq("hourIndex", hourIndex))
      .collect();
    const iPosted = caps.some((c) => c.userId === userId);
    const closed = Date.now() >= day.startAt + (hourIndex + 1) * day.slotMs || day.status === "done";
    const allPosted = users.every((u) => caps.some((c) => c.userId === u._id));
    const revealed = iPosted || closed || allPosted;
    const members = await Promise.all(
      users.map(async (u) => {
        const c = caps.find((x) => x.userId === u._id);
        const commentCount = c && revealed ? (await ctx.db.query("comments").withIndex("by_capture", (q) => q.eq("captureId", c._id)).collect()).length : 0;
        return {
          captureId: c && revealed ? c._id : null,
          commentCount,
          user: u,
          posted: !!c,
          takenAt: c?.takenAt ?? null,
          url: c && revealed ? await ctx.storage.getUrl(c.storageId) : null,
        };
      }),
    );
    return { revealed, iPosted, closed, members, postedCount: caps.length };
  },
});
