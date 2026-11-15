import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { hourLabel } from "./time";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function scheduleDayPings(day: {
  _id: string;
  startAt: number;
  slotMs: number;
  hourCount: number;
  startHour: number;
  groupName?: string | null;
  title?: string | null;
}) {
  if (Platform.OS === "web") return 0;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return 0;
  const now = Date.now();
  let count = 0;
  for (let i = 0; i < day.hourCount; i++) {
    const at = day.startAt + i * day.slotMs;
    if (at <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: day._id + ":" + i,
      content: {
        title: "it's ourli time 📸",
        body: hourLabel(day.startHour + i) + ", show " + (day.groupName ?? day.title ?? "the group"),
        data: { url: "ourli://day/" + day._id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
    count++;
  }
  return count;
}
