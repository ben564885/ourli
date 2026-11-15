import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { addAvatar } from "./lib";

export const feed = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const days = await ctx.db.query("days").filter((q) => q.eq(q.field("type"), "creator")).order("desc").take(20);
    return await Promise.all(
      days.map(async (d) => {
        const creator = await addAvatar(ctx, d.creatorId ? await ctx.db.get(d.creatorId) : null);
        const caps = await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", d._id)).collect();
        const theirs = caps.filter((c) => c.userId === d.creatorId).sort((a, b) => a.hourIndex - b.hourIndex);
        const fans = await ctx.db.query("creatorDayFans").withIndex("by_day", (q) => q.eq("dayId", d._id)).collect();
        const joined = d.creatorId === userId || fans.some((f) => f.userId === userId);
        return {
          dayId: d._id,
          joinCode: d.joinCode ?? "",
          title: d.title ?? "Creator Day",
          creator,
          startHour: d.startHour,
          endHour: d.endHour,
          hourCount: d.hourCount,
          status: d.status,
          fanCount: fans.length,
          joined,
          preview: theirs[0] ? await ctx.storage.getUrl(theirs[0].storageId) : null,
          locked: await Promise.all(theirs.slice(1, 3).map((c) => ctx.storage.getUrl(c.storageId))),
        };
      }),
    );
  },
});

const CREATORS = [
  { name: "Maya", code: "MAYA1", title: "A Day with Maya", color: "#FF8FAB" },
  { name: "Jordan", code: "JORD2", title: "Studio Day with Jordan", color: "#6BC5FF" },
  { name: "Sofia", code: "SOFI3", title: "Sofia's Sunday Reset", color: "#FFD166" },
];

export const seedCreators = internalMutation({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, { storageIds }) => {
    const ben = (await ctx.db.query("users").collect()).find((u) => u.avatarId);
    const product = process.env.WHOP_PRODUCT_ID ?? "demo";
    const now = Date.now();
    let made = 0;
    for (const [i, c] of CREATORS.entries()) {
      const exists = await ctx.db.query("days").withIndex("by_join", (q) => q.eq("joinCode", c.code)).unique();
      if (exists) continue;
      const userId: Id<"users"> = await ctx.db.insert("users", { name: c.name, color: c.color, avatarId: ben?.avatarId });
      const startAt = now - 2.5 * 3600_000;
      const dayId = await ctx.db.insert("days", {
        creatorId: userId, title: c.title, date: new Date(now).toISOString().slice(0, 10),
        startHour: 9, endHour: 17, startAt, slotMs: 3600_000, hourCount: 8, status: "active",
        type: "creator", whopProductId: product, joinCode: c.code,
      });
      for (let h = 0; h < 3; h++) {
        const s = storageIds[(i * 7 + h * 5 + 3) % storageIds.length];
        await ctx.db.insert("captures", { dayId, userId, hourIndex: h, storageId: s, thumbId: s, takenAt: startAt + h * 3600_000 + 12 * 60_000 });
      }
      made++;
    }
    return "seeded " + made + " creator days";
  },
});
