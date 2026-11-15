import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    color: v.string(),
    avatarId: v.optional(v.id("_storage")),
  }),
  groups: defineTable({
    name: v.string(),
    inviteCode: v.string(),
    createdBy: v.id("users"),
  }).index("by_invite", ["inviteCode"]),
  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"]),
  days: defineTable({
    groupId: v.optional(v.id("groups")),
    creatorId: v.optional(v.id("users")),
    title: v.optional(v.string()),
    date: v.string(),
    startHour: v.number(),
    endHour: v.number(),
    startAt: v.number(),
    slotMs: v.number(),
    hourCount: v.number(),
    status: v.union(v.literal("active"), v.literal("done")),
    coverPhotoId: v.optional(v.id("_storage")),
    type: v.union(v.literal("group"), v.literal("creator")),
    whopProductId: v.optional(v.string()),
    joinCode: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_group_date", ["groupId", "date"])
    .index("by_join", ["joinCode"])
    .index("by_creator", ["creatorId"]),
  captures: defineTable({
    dayId: v.id("days"),
    userId: v.id("users"),
    hourIndex: v.number(),
    storageId: v.id("_storage"),
    thumbId: v.optional(v.id("_storage")),
    takenAt: v.number(),
  })
    .index("by_day", ["dayId"])
    .index("by_day_hour", ["dayId", "hourIndex"])
    .index("by_day_user_hour", ["dayId", "userId", "hourIndex"]),
  comments: defineTable({
    captureId: v.id("captures"),
    userId: v.id("users"),
    text: v.string(),
  }).index("by_capture", ["captureId"]),
  oauthStates: defineTable({
    state: v.string(),
    codeVerifier: v.string(),
    dayId: v.id("days"),
    userId: v.id("users"),
    returnTo: v.string(),
  }).index("by_state", ["state"]),
  creatorDayFans: defineTable({
    dayId: v.id("days"),
    userId: v.id("users"),
    whopUserId: v.optional(v.string()),
    verifiedAt: v.number(),
    method: v.union(v.literal("whop"), v.literal("demo")),
  })
    .index("by_day", ["dayId"])
    .index("by_user", ["userId"])
    .index("by_day_user", ["dayId", "userId"]),
});
