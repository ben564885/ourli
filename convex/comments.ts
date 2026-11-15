import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { canAccessDay } from "./lib";

async function visibleCapture(ctx: QueryCtx, captureId: Id<"captures">, userId: Id<"users">) {
  const capture = await ctx.db.get(captureId);
  if (!capture) return null;
  const day = await ctx.db.get(capture.dayId);
  if (!day || !(await canAccessDay(ctx, day, userId))) return null;
  if (day.type === "creator" && day.creatorId !== userId && capture.userId !== userId && capture.userId !== day.creatorId) return null;
  const closed = Date.now() >= day.startAt + (capture.hourIndex + 1) * day.slotMs || day.status === "done";
  const mine = await ctx.db
    .query("captures")
    .withIndex("by_day_user_hour", (q) => q.eq("dayId", day._id).eq("userId", userId).eq("hourIndex", capture.hourIndex))
    .unique();
  if (!closed && !mine) return null;
  return { capture, day };
}

export const forCapture = query({
  args: { captureId: v.id("captures"), userId: v.id("users") },
  handler: async (ctx, { captureId, userId }) => {
    const found = await visibleCapture(ctx, captureId, userId);
    if (!found) return null;
    const { capture, day } = found;
    const author = await ctx.db.get(capture.userId);
    const rows = await ctx.db.query("comments").withIndex("by_capture", (q) => q.eq("captureId", captureId)).collect();
    const comments = await Promise.all(rows.map(async (c) => ({ ...c, user: await ctx.db.get(c.userId) })));
    return {
      url: await ctx.storage.getUrl(capture.storageId),
      takenAt: capture.takenAt,
      hour: day.startHour + capture.hourIndex,
      author,
      comments,
    };
  },
});

export const add = mutation({
  args: { captureId: v.id("captures"), userId: v.id("users"), text: v.string() },
  handler: async (ctx, { captureId, userId, text }) => {
    const body = text.trim().slice(0, 280);
    if (!body) return;
    if (!(await visibleCapture(ctx, captureId, userId))) throw new Error("You can't comment on this photo yet");
    await ctx.db.insert("comments", { captureId, userId, text: body });
  },
});
