import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

function ymd(d: Date) {
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}

async function storeImage(ctx: { storage: { store: (b: Blob) => Promise<Id<"_storage">> } }, seed: string, w: number, h: number) {
  const res = await fetch("https://picsum.photos/seed/" + seed + "/" + w + "/" + h);
  if (!res.ok) throw new Error("image fetch failed");
  return await ctx.storage.store(await res.blob());
}

export const seedGroup = action({
  args: { groupId: v.id("groups"), userId: v.id("users") },
  handler: async (ctx, { groupId, userId }): Promise<number> => {
    const members: Id<"users">[] = await ctx.runMutation(internal.seed.ensureDemoMembers, { groupId });
    const today = new Date();
    const offsets = [2, 3, 5, 6, 8, 9, 12, 13, 15, 16, 19, 20, 22, 26, 27, 33, 34, 40];
    let created = 0;
    for (const off of offsets) {
      const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - off));
      const date = ymd(d);
      const startHour = 12;
      const hourCount = 4;
      const startAt = d.getTime() + startHour * 3600_000;
      const captures: { userId: Id<"users">; hourIndex: number; storageId: Id<"_storage">; thumbId: Id<"_storage">; takenAt: number }[] = [];
      for (let h = 0; h < hourCount; h++) {
        for (const m of members) {
          if (Math.random() < 0.12) continue;
          const seed = "ourli-" + date + "-" + h + "-" + m;
          const [storageId, thumbId] = await Promise.all([storeImage(ctx, seed, 720, 960), storeImage(ctx, seed, 180, 240)]);
          captures.push({ userId: m, hourIndex: h, storageId, thumbId, takenAt: startAt + h * 3600_000 + Math.floor(Math.random() * 50) * 60_000 });
        }
      }
      const ok = await ctx.runMutation(internal.seed.insertDay, { groupId, date, startHour, hourCount, startAt, captures });
      if (ok) created++;
    }
    return created;
  },
});

export const ensureDemoMembers = internalMutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const members = await ctx.db.query("groupMembers").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const ids = members.map((m) => m.userId);
    const names = ["Maya", "Leo", "Priya"];
    const colors = ["#FF8FAB", "#5EE6A8", "#FFB86B"];
    for (let i = 0; ids.length < 3 && i < names.length; i++) {
      const id = await ctx.db.insert("users", { name: names[i], color: colors[i] });
      await ctx.db.insert("groupMembers", { groupId, userId: id });
      ids.push(id);
    }
    return ids.slice(0, 4);
  },
});

export const insertDay = internalMutation({
  args: {
    groupId: v.id("groups"),
    date: v.string(),
    startHour: v.number(),
    hourCount: v.number(),
    startAt: v.number(),
    captures: v.array(v.object({ userId: v.id("users"), hourIndex: v.number(), storageId: v.id("_storage"), thumbId: v.id("_storage"), takenAt: v.number() })),
  },
  handler: async (ctx, a) => {
    const existing = await ctx.db.query("days").withIndex("by_group_date", (q) => q.eq("groupId", a.groupId).eq("date", a.date)).first();
    if (existing) {
      for (const c of a.captures) {
        await ctx.storage.delete(c.storageId);
        await ctx.storage.delete(c.thumbId);
      }
      return false;
    }
    const mid = a.captures.find((c) => c.hourIndex === Math.floor(a.hourCount / 2)) ?? a.captures[0];
    const dayId = await ctx.db.insert("days", {
      groupId: a.groupId,
      date: a.date,
      startHour: a.startHour,
      endHour: a.startHour + a.hourCount,
      startAt: a.startAt,
      slotMs: 3600_000,
      hourCount: a.hourCount,
      status: "done",
      type: "group",
      coverPhotoId: mid?.thumbId,
    });
    for (const c of a.captures) await ctx.db.insert("captures", { dayId, ...c });
    return true;
  },
});
