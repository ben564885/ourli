import { internalMutation, mutation, query, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { canAccessDay, isFinished, participants, randomCode } from "./lib";

const dayArgs = {
  date: v.string(),
  startHour: v.number(),
  endHour: v.number(),
  startAt: v.number(),
  slotMinutes: v.number(),
};

export const start = mutation({
  args: { groupId: v.id("groups"), userId: v.id("users"), ...dayArgs },
  handler: async (ctx, a) => {
    const member = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => q.eq("groupId", a.groupId).eq("userId", a.userId))
      .unique();
    if (!member) throw new Error("Not in this group");
    const existing = await ctx.db
      .query("days")
      .withIndex("by_group", (q) => q.eq("groupId", a.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    for (const d of existing) await ctx.db.patch(d._id, { status: "done" });
    const hourCount = Math.max(1, a.endHour - a.startHour);
    const slotMs = a.slotMinutes * 60_000;
    const dayId = await ctx.db.insert("days", {
      groupId: a.groupId,
      date: a.date,
      startHour: a.startHour,
      endHour: a.endHour,
      startAt: a.startAt,
      slotMs,
      hourCount,
      status: "active",
      type: "group",
    });
    await ctx.scheduler.runAt(a.startAt + slotMs * hourCount, internal.days.finish, { dayId });
    return dayId;
  },
});

export const startCreator = mutation({
  args: { userId: v.id("users"), title: v.string(), whopProductId: v.string(), ...dayArgs },
  handler: async (ctx, a) => {
    const hourCount = Math.max(1, a.endHour - a.startHour);
    const slotMs = a.slotMinutes * 60_000;
    const dayId = await ctx.db.insert("days", {
      creatorId: a.userId,
      title: a.title.trim().slice(0, 60),
      date: a.date,
      startHour: a.startHour,
      endHour: a.endHour,
      startAt: a.startAt,
      slotMs,
      hourCount,
      status: "active",
      type: "creator",
      whopProductId: a.whopProductId,
      joinCode: randomCode(5),
    });
    await ctx.scheduler.runAt(a.startAt + slotMs * hourCount, internal.days.finish, { dayId });
    return dayId;
  },
});

export const end = mutation({
  args: { dayId: v.id("days") },
  handler: async (ctx, { dayId }) => {
    await ctx.runMutation(internal.days.finish, { dayId });
  },
});

export const finish = internalMutation({
  args: { dayId: v.id("days") },
  handler: async (ctx, { dayId }) => {
    const day = await ctx.db.get(dayId);
    if (!day) return;
    const captures = await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", dayId)).collect();
    const patch: Partial<Doc<"days">> = { status: "done" };
    if (!day.coverPhotoId && captures.length > 0) {
      const mid = Math.floor(day.hourCount / 2);
      const sorted = [...captures].sort((x, y) => Math.abs(x.hourIndex - mid) - Math.abs(y.hourIndex - mid));
      patch.coverPhotoId = sorted[0].thumbId ?? sorted[0].storageId;
    }
    await ctx.db.patch(dayId, patch);
  },
});

async function hydrateDay(ctx: QueryCtx, day: Doc<"days">) {
  const group = day.groupId ? await ctx.db.get(day.groupId) : null;
  const creator = day.creatorId ? await ctx.db.get(day.creatorId) : null;
  return { ...day, groupName: group?.name ?? null, creator };
}

export const get = query({
  args: { dayId: v.id("days") },
  handler: async (ctx, { dayId }) => {
    const day = await ctx.db.get(dayId);
    return day ? await hydrateDay(ctx, day) : null;
  },
});

export const byJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, { joinCode }) => {
    const day = await ctx.db.query("days").withIndex("by_join", (q) => q.eq("joinCode", joinCode.toUpperCase())).unique();
    if (!day) return null;
    const fans = await ctx.db.query("creatorDayFans").withIndex("by_day", (q) => q.eq("dayId", day._id)).collect();
    return { ...(await hydrateDay(ctx, day)), fanCount: fans.length };
  },
});

export const activeForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db.query("groupMembers").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const out: Awaited<ReturnType<typeof hydrateDay>>[] = [];
    for (const m of memberships) {
      const d = await ctx.db
        .query("days")
        .withIndex("by_group", (q) => q.eq("groupId", m.groupId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();
      if (d) out.push(await hydrateDay(ctx, d));
    }
    const fanOf = await ctx.db.query("creatorDayFans").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const f of fanOf) {
      const d = await ctx.db.get(f.dayId);
      if (d && d.status === "active") out.push(await hydrateDay(ctx, d));
    }
    const mine = await ctx.db
      .query("days")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    for (const d of mine) out.push(await hydrateDay(ctx, d));
    return out;
  },
});

function visibleUsers(day: Doc<"days">, all: Doc<"users">[], viewer: Id<"users">) {
  if (day.type === "group" || day.creatorId === viewer) return all;
  return all.filter((u) => u._id === day.creatorId || u._id === viewer);
}

export const recap = query({
  args: { dayId: v.id("days"), userId: v.id("users") },
  handler: async (ctx, { dayId, userId }) => {
    const day = await ctx.db.get(dayId);
    if (!day || !(await canAccessDay(ctx, day, userId))) return null;
    const users = visibleUsers(day, await participants(ctx, day), userId);
    const captures = await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", dayId)).collect();
    const now = Date.now();
    const rows = await Promise.all(
      Array.from({ length: day.hourCount }, async (_, hourIndex) => {
        const closed = now >= day.startAt + (hourIndex + 1) * day.slotMs;
        const iPosted = captures.some((c) => c.hourIndex === hourIndex && c.userId === userId);
        const reveal = closed || iPosted || day.status === "done";
        const cells = await Promise.all(
          users.map(async (u) => {
            const c = captures.find((x) => x.hourIndex === hourIndex && x.userId === u._id);
            if (!c) return { userId: u._id, captureId: null, url: null, thumbUrl: null, takenAt: null, posted: false };
            return {
              userId: u._id,
              captureId: reveal ? c._id : null,
              posted: true,
              takenAt: c.takenAt,
              url: reveal ? await ctx.storage.getUrl(c.storageId) : null,
              thumbUrl: reveal && c.thumbId ? await ctx.storage.getUrl(c.thumbId) : null,
            };
          }),
        );
        return { hourIndex, hour: day.startHour + hourIndex, closed, cells };
      }),
    );
    return { day: await hydrateDay(ctx, day), users, rows };
  },
});

export const byMonth = query({
  args: { userId: v.id("users"), month: v.string(), groupId: v.optional(v.id("groups")) },
  handler: async (ctx, { userId, month, groupId }) => {
    const lo = month + "-01";
    const hi = month + "-32";
    let days: Doc<"days">[] = [];
    const groupIds = groupId
      ? [groupId]
      : (await ctx.db.query("groupMembers").withIndex("by_user", (q) => q.eq("userId", userId)).collect()).map((m) => m.groupId);
    for (const gid of groupIds) {
      days.push(
        ...(await ctx.db
          .query("days")
          .withIndex("by_group_date", (q) => q.eq("groupId", gid).gte("date", lo).lt("date", hi))
          .collect()),
      );
    }
    if (!groupId) {
      const fanOf = await ctx.db.query("creatorDayFans").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
      for (const f of fanOf) {
        const d = await ctx.db.get(f.dayId);
        if (d && d.date >= lo && d.date < hi) days.push(d);
      }
      const mine = await ctx.db.query("days").withIndex("by_creator", (q) => q.eq("creatorId", userId)).collect();
      days.push(...mine.filter((d) => d.date >= lo && d.date < hi));
    }
    const out = await Promise.all(
      days.map(async (d) => {
        let coverId = d.coverPhotoId;
        if (!coverId) {
          const c = await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", d._id)).order("desc").first();
          coverId = c?.thumbId ?? c?.storageId;
        }
        return {
          date: d.date,
          dayId: d._id,
          type: d.type,
          status: d.status,
          coverPhotoUrl: coverId ? await ctx.storage.getUrl(coverId) : null,
        };
      }),
    );
    const byDate = new Map<string, (typeof out)[number]>();
    for (const d of out) {
      const prev = byDate.get(d.date);
      if (!prev || (!prev.coverPhotoUrl && d.coverPhotoUrl) || d.type === "creator") byDate.set(d.date, { ...d, type: prev?.type === "creator" ? "creator" : d.type });
    }
    return [...byDate.values()];
  },
});
