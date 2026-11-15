import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const CODE = "OURLI1";
const PEOPLE = [
  { name: "Ben", color: "#FF8FAB" },
  { name: "Philip", color: "#5EE6A8" },
  { name: "Ayush", color: "#7C83FD" },
  { name: "Daniel", color: "#FFB86B" },
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

export const fixCrew = internalMutation({
  args: {},
  handler: async (ctx) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) return "no group";
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    const users = (await Promise.all(members.map((m) => ctx.db.get(m.userId)))).filter((u) => u !== null);
    const yelena = users.find((u) => u.name === "Yelena");
    if (yelena) await ctx.db.patch(yelena._id, { name: "Ben", color: "#FF8FAB" });
    if (users.some((u) => u.name === "Daniel")) return "renamed";
    const daniel = await ctx.db.insert("users", { name: "Daniel", color: "#FFB86B" });
    await ctx.db.insert("groupMembers", { groupId: group._id, userId: daniel });
    await ctx.scheduler.runAfter(0, internal.demo.backfillUser, { groupId: group._id, userId: daniel });
    return "added Daniel";
  },
});

export const reseedDays = internalMutation({
  args: {},
  handler: async (ctx) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) return "no group";
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    const users = members.map((m) => m.userId);
    const days = await ctx.db.query("days").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    const pool = new Set<Id<"_storage">>();
    for (const day of days) {
      for (const c of await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", day._id)).collect()) {
        pool.add(c.storageId);
        await ctx.db.delete(c._id);
      }
      await ctx.db.delete(day._id);
    }
    const ids = [...pool];
    const now = new Date();
    for (let off = 1; off <= 60; off++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - off);
      const date = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const startAt = d.getTime() + 11 * 3600_000;
      const dayId = await ctx.db.insert("days", { groupId: group._id, date, startHour: 11, endHour: 16, startAt, slotMs: 3600_000, hourCount: 5, status: "done", type: "group" });
      let cover: Id<"_storage"> | undefined;
      for (let h = 0; h < 5; h++) {
        for (const u of users) {
          if (Math.random() < 0.08) continue;
          const s = pick(ids);
          if (!cover) cover = s;
          await ctx.db.insert("captures", { dayId, userId: u, hourIndex: h, storageId: s, thumbId: s, takenAt: startAt + h * 3600_000 + Math.floor(Math.random() * 50) * 60_000 });
        }
      }
      await ctx.db.patch(dayId, { coverPhotoId: cover ?? pick(ids) });
    }
    return "reseeded 60 days for " + users.length + " members";
  },
});

export const dedupeCrew = internalMutation({
  args: {},
  handler: async (ctx) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) return "no group";
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    const seen = new Set<string>();
    let n = 0;
    for (const m of members) {
      const u = await ctx.db.get(m.userId);
      if (!u) continue;
      if (seen.has(u.name) || !PEOPLE.some((p) => p.name === u.name)) {
        for (const c of await ctx.db.query("captures").filter((q) => q.eq(q.field("userId"), u._id)).collect()) await ctx.db.delete(c._id);
        await ctx.db.delete(m._id);
        n++;
      } else seen.add(u.name);
    }
    return "removed " + n;
  },
});

export const loginBen = mutation({
  args: {},
  handler: async (ctx) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) throw new Error("Demo group is not seeded");
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    for (const m of members) {
      const u = await ctx.db.get(m.userId);
      if (u?.name === "Ben") return { userId: u._id, groupId: group._id };
    }
    throw new Error("Demo Ben is missing");
  },
});

export const setAvatars = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) return 0;
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    for (const m of members) await ctx.db.patch(m.userId, { avatarId: storageId });
    return members.length;
  },
});

export const setAvatar = internalMutation({
  args: { name: v.string(), storageId: v.optional(v.id("_storage")) },
  handler: async (ctx, { name, storageId }) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) return 0;
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    let n = 0;
    for (const m of members) {
      const u = await ctx.db.get(m.userId);
      if (u?.name === name) { await ctx.db.patch(u._id, { avatarId: storageId }); n++; }
    }
    return n;
  },
});

export const clearCreatorAvatars = internalMutation({
  args: {},
  handler: async (ctx) => {
    let n = 0;
    for (const day of await ctx.db.query("days").filter((q) => q.eq(q.field("type"), "creator")).collect()) {
      if (day.creatorId) { await ctx.db.patch(day.creatorId, { avatarId: undefined }); n++; }
    }
    return n;
  },
});
