import { QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export function randomCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function currentHourIndex(day: Doc<"days">, now = Date.now()) {
  return Math.floor((now - day.startAt) / day.slotMs);
}

export function isFinished(day: Doc<"days">, now = Date.now()) {
  return day.status === "done" || now >= day.startAt + day.slotMs * day.hourCount;
}

export async function participants(ctx: QueryCtx, day: Doc<"days">) {
  if (day.type === "group" && day.groupId) {
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", day.groupId!))
      .collect();
    const users = await Promise.all(members.map((m) => ctx.db.get(m.userId)));
    return users.filter((u): u is Doc<"users"> => u !== null);
  }
  const fans = await ctx.db
    .query("creatorDayFans")
    .withIndex("by_day", (q) => q.eq("dayId", day._id))
    .collect();
  const ids: Id<"users">[] = [day.creatorId!, ...fans.map((f) => f.userId)];
  const users = await Promise.all(ids.map((id) => ctx.db.get(id)));
  return users.filter((u): u is Doc<"users"> => u !== null);
}

export async function canAccessDay(ctx: QueryCtx, day: Doc<"days">, userId: Id<"users">) {
  if (day.type === "group" && day.groupId) {
    const m = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => q.eq("groupId", day.groupId!).eq("userId", userId))
      .unique();
    return m !== null;
  }
  if (day.creatorId === userId) return true;
  const fan = await ctx.db
    .query("creatorDayFans")
    .withIndex("by_day_user", (q) => q.eq("dayId", day._id).eq("userId", userId))
    .unique();
  return fan !== null;
}
