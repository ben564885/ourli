import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const CODE = "OURLI1";
const PEOPLE = [
  { name: "Ayush", color: "#7C83FD" },
  { name: "Yelena", color: "#FF8FAB" },
  { name: "Philip", color: "#5EE6A8" },
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const ymd = (d: Date) => d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");

export const seed = internalMutation({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, { storageIds }) => {
    const old = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (old) return "already seeded";
    const users: Id<"users">[] = [];
    for (const p of PEOPLE) users.push(await ctx.db.insert("users", p));
    const groupId = await ctx.db.insert("groups", { name: "ourli crew", inviteCode: CODE, demo: true, createdBy: users[0] });
    for (const u of users) await ctx.db.insert("groupMembers", { groupId, userId: u });
    const now = new Date();
    const offsets = [1, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19, 21, 23, 25, 28, 30, 33, 36, 39, 42, 46, 50, 55, 61, 68, 75, 83];
    for (const off of offsets) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - off));
      const date = ymd(d);
      const hourCount = 5;
      const startHour = 11;
      const startAt = d.getTime() + startHour * 3600_000;
      const dayId = await ctx.db.insert("days", { groupId, date, startHour, endHour: startHour + hourCount, startAt, slotMs: 3600_000, hourCount, status: "done", type: "group" });
      let cover: Id<"_storage"> | undefined;
      for (let h = 0; h < hourCount; h++) {
        for (const u of users) {
          if (Math.random() < 0.08) continue;
          const s = pick(storageIds);
          if (h === 2 && !cover) cover = s;
          await ctx.db.insert("captures", { dayId, userId: u, hourIndex: h, storageId: s, thumbId: s, takenAt: startAt + h * 3600_000 + Math.floor(Math.random() * 50) * 60_000 });
        }
      }
      await ctx.db.patch(dayId, { coverPhotoId: cover });
    }
    return "seeded " + offsets.length + " days";
  },
});

export const backfillUser = internalMutation({
  args: { groupId: v.id("groups"), userId: v.id("users") },
  handler: async (ctx, { groupId, userId }) => {
    const days = await ctx.db.query("days").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    for (const day of days) {
      if (day.status !== "done") continue;
      const caps = await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", day._id)).collect();
      if (!caps.length) continue;
      for (let h = 0; h < day.hourCount; h++) {
        if (Math.random() < 0.08) continue;
        const s = pick(caps).storageId;
        await ctx.db.insert("captures", { dayId: day._id, userId, hourIndex: h, storageId: s, thumbId: s, takenAt: day.startAt + h * 3600_000 + Math.floor(Math.random() * 50) * 60_000 });
      }
    }
  },
});

export const removeTesters = internalMutation({
  args: {},
  handler: async (ctx) => {
    let n = 0;
    for (const u of await ctx.db.query("users").collect()) {
      if (!u.name.startsWith("Tester")) continue;
      for (const m of await ctx.db.query("groupMembers").withIndex("by_user", (q) => q.eq("userId", u._id)).collect()) await ctx.db.delete(m._id);
      for (const c of await ctx.db.query("captures").filter((q) => q.eq(q.field("userId"), u._id)).collect()) await ctx.db.delete(c._id);
      await ctx.db.delete(u._id);
      n++;
    }
    return n;
  },
});
