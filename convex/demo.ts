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

const KEEP = ["Philip", "Ayush", "Daniel"];
const EXTRA = [
  { name: "Roommates", code: "ROOM2", color: "#FF9EB5", icon: "home", members: ["Ben", "Ayush", "Daniel"] },
  { name: "College crew", code: "COLL3", color: "#8FE0B0", icon: "school", members: ["Ben", "Philip", "Ayush"] },
];

async function demoGroups(ctx: { db: any }) {
  const out: any[] = [];
  for (const code of [CODE, ...EXTRA.map((e) => e.code)]) {
    const gr = await ctx.db.query("groups").withIndex("by_invite", (q: any) => q.eq("inviteCode", code)).unique();
    if (gr) out.push(gr);
  }
  return out;
}

export const seedExtraGroups = internalMutation({
  args: {},
  handler: async (ctx) => {
    const main = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!main) return "no main group";
    await ctx.db.patch(main._id, { color: "#7DB7F0", icon: "sparkles" });
    const mainMembers = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", main._id)).collect();
    const byName = new Map<string, Id<"users">>();
    for (const m of mainMembers) {
      const u = await ctx.db.get(m.userId);
      if (u) byName.set(u.name, u._id);
    }
    let n = 0;
    for (const e of EXTRA) {
      if (await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", e.code)).unique()) continue;
      const createdBy = byName.get("Ben") ?? [...byName.values()][0];
      const groupId = await ctx.db.insert("groups", { name: e.name, inviteCode: e.code, demo: true, color: e.color, icon: e.icon, createdBy });
      for (const name of e.members) {
        const uid = byName.get(name);
        if (uid) await ctx.db.insert("groupMembers", { groupId, userId: uid });
      }
      n++;
    }
    return "added " + n + " groups";
  },
});

export const setCreatorAvatar = internalMutation({
  args: { name: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { name, storageId }) => {
    let n = 0;
    for (const day of await ctx.db.query("days").filter((q) => q.eq(q.field("type"), "creator")).collect()) {
      const u = day.creatorId ? await ctx.db.get(day.creatorId) : null;
      if (u?.name === name) {
        await ctx.db.patch(u._id, { avatarId: storageId });
        n++;
      }
    }
    return n;
  },
});
const COLORS = ["#7C83FD", "#FF8FAB", "#FFB86B", "#5EE6A8", "#6BC5FF", "#C38BFF", "#FFD166"];

export const joinDemo = mutation({
  args: { name: v.string(), avatarId: v.optional(v.id("_storage")), localHour: v.optional(v.number()), date: v.optional(v.string()) },
  handler: async (ctx, { name, avatarId, localHour, date }) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) throw new Error("Demo group is not seeded");
    const all = await demoGroups(ctx);
    for (const gr of all) {
      const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", gr._id)).collect();
      for (const m of members) {
        const u = await ctx.db.get(m.userId);
        if (u && KEEP.includes(u.name)) continue;
        for (const c of await ctx.db.query("captures").filter((q) => q.eq(q.field("userId"), m.userId)).collect()) await ctx.db.delete(c._id);
        await ctx.db.delete(m._id);
      }
    }
    const userId = await ctx.db.insert("users", { name: name.trim().slice(0, 32), color: COLORS[Math.floor(Math.random() * COLORS.length)], avatarId });
    for (const gr of all) await ctx.db.insert("groupMembers", { groupId: gr._id, userId });
    await ctx.scheduler.runAfter(0, internal.demo.backfillUser, { groupId: group._id, userId });

    const nowMs = Date.now();
    const slotMs = 3600_000;
    const startAt = Math.floor(nowMs / slotMs) * slotMs - 2 * slotMs;
    const hour = localHour ?? new Date().getHours();
    const startHour = Math.min(Math.max(0, hour - 2), 18);
    const dayDate = date ?? ymd(new Date());
    const pool = (await ctx.db.query("captures").take(60)).map((c) => c.storageId);
    let mainDay: Id<"days"> | null = null;
    for (const gr of all) {
      for (const old of await ctx.db.query("days").withIndex("by_group", (q) => q.eq("groupId", gr._id)).filter((q) => q.eq(q.field("status"), "active")).collect()) {
        await ctx.db.patch(old._id, { status: "done" });
      }
      const dayId = await ctx.db.insert("days", { groupId: gr._id, date: dayDate, startHour, endHour: startHour + 6, startAt, slotMs, hourCount: 6, status: "active", type: "group" });
      await ctx.scheduler.runAt(startAt + 6 * slotMs, internal.days.finish, { dayId });
      const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", gr._id)).collect();
      for (const m of members) {
        for (let h = 0; h < 3; h++) {
          if (h === 2 && m.userId === userId) continue;
          const s = pick(pool);
          await ctx.db.insert("captures", { dayId, userId: m.userId, hourIndex: h, storageId: s, thumbId: s, takenAt: startAt + h * slotMs + Math.floor(Math.random() * 40 + 5) * 60_000 });
        }
      }
      await ctx.db.patch(dayId, { coverPhotoId: pick(pool) });
      if (gr._id === group._id) mainDay = dayId;
    }
    return { userId, groupId: group._id, dayId: mainDay };
  },
});

export const seedRange = internalMutation({
  args: { storageIds: v.array(v.id("_storage")), from: v.number(), to: v.number() },
  handler: async (ctx, { storageIds, from, to }) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) return "no group";
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", group._id)).collect();
    const users = members.map((m) => m.userId);
    const now = new Date();
    let n = 0;
    for (let off = from; off <= to; off++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
      const date = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      for (const day of await ctx.db.query("days").withIndex("by_group_date", (q) => q.eq("groupId", group._id).eq("date", date)).collect()) {
        for (const c of await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", day._id)).collect()) await ctx.db.delete(c._id);
        await ctx.db.delete(day._id);
      }
      const startAt = d.getTime() + 11 * 3600_000;
      const dayId = await ctx.db.insert("days", { groupId: group._id, date, startHour: 11, endHour: 16, startAt, slotMs: 3600_000, hourCount: 5, status: "done", type: "group" });
      let cover: Id<"_storage"> | undefined;
      for (let h = 0; h < 5; h++) {
        for (const u of users) {
          if (Math.random() < 0.06) continue;
          const s = pick(storageIds);
          if (!cover) cover = s;
          await ctx.db.insert("captures", { dayId, userId: u, hourIndex: h, storageId: s, thumbId: s, takenAt: startAt + h * 3600_000 + Math.floor(Math.random() * 50) * 60_000 });
        }
      }
      await ctx.db.patch(dayId, { coverPhotoId: cover ?? pick(storageIds) });
      n++;
    }
    return "seeded " + n + " days";
  },
});

export const clearRange = internalMutation({
  args: { from: v.number(), to: v.number() },
  handler: async (ctx, { from, to }) => {
    const group = await ctx.db.query("groups").withIndex("by_invite", (q) => q.eq("inviteCode", CODE)).unique();
    if (!group) return "no group";
    const now = new Date();
    let n = 0;
    for (let off = from; off <= to; off++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
      const date = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      for (const day of await ctx.db.query("days").withIndex("by_group_date", (q) => q.eq("groupId", group._id).eq("date", date)).collect()) {
        for (const c of await ctx.db.query("captures").withIndex("by_day", (q) => q.eq("dayId", day._id)).collect()) await ctx.db.delete(c._id);
        await ctx.db.delete(day._id);
        n++;
      }
    }
    return "cleared " + n;
  },
});
