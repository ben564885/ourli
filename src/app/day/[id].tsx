import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { useNow } from "@/lib/use-now";
import { dayClock, formatCountdown, hourLabel } from "@/lib/time";
import { C, F } from "@/lib/theme";
import { Button, H1, Loading, Pill, Screen } from "@/components/ui";
import { HourReveal } from "@/components/hour-reveal";

export default function DayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dayId = id as Id<"days">;
  const { userId } = useSession();
  const day = useQuery(api.days.get, { dayId });
  const end = useMutation(api.days.end);
  const now = useNow();
  const [picked, setPicked] = useState<number | null>(null);
  const liveHour = day ? dayClock(day, now).current : 0;
  const mine = useQuery(api.captures.byHour, userId ? { dayId, hourIndex: liveHour, userId, tick: day ? Math.floor((now - day.startAt) / day.slotMs) : 0 } : "skip");

  if (day === undefined || !userId) return <Loading />;
  if (day === null) return <Screen><H1>Day not found</H1></Screen>;

  const clock = dayClock(day, now);
  const hour = picked ?? clock.current;
  const tick = Math.floor((now - day.startAt) / day.slotMs);
  const title = day.type === "creator" ? (day.title ?? "Creator Day") : day.groupName;

  return (
    <Screen style={{ paddingBottom: 24 }}>
      {day.type === "creator" && <Pill text={"Creator Day with " + (day.creator?.name ?? "")} color={C.whop} />}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <H1 style={{ flexShrink: 0 }}>{title}</H1>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ flex: 1, textAlign: "right", color: C.muted, fontFamily: F.sans, fontSize: 14 }}>
          {clock.ended
            ? "Day is over"
            : clock.notStarted
              ? hourLabel(day.startHour) + " · in " + formatCountdown(clock.msLeft)
              : hourLabel(day.startHour + clock.current) + " · hour " + (clock.current + 1) + " of " + day.hourCount + " · " + formatCountdown(clock.msLeft) + " left"}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {Array.from({ length: day.hourCount }, (_, i) => {
          const future = !clock.ended && i > clock.current;
          const active = i === hour;
          return (
            <Pressable
              key={i}
              disabled={future}
              onPress={() => setPicked(i)}
              style={{ paddingHorizontal: 20, height: 48, borderRadius: 999, justifyContent: "center", borderWidth: 1.5, borderColor: active ? C.accent : C.hair, backgroundColor: active ? C.accent : C.card, opacity: future ? 0.35 : 1 }}>
              <Text style={{ color: active ? C.onAccent : C.text, fontFamily: active ? F.sansBold : F.sansMedium, fontSize: 17 }}>{hourLabel(day.startHour + i)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <HourReveal dayId={dayId} hourIndex={hour} userId={userId} tick={tick} />

      {(() => {
        const canSnap = !clock.ended && !clock.notStarted && hour === clock.current && !mine?.iPosted;
        return (
          <>
            {canSnap && (
              <Button testID="snap" title={"Snap " + hourLabel(day.startHour + clock.current) + " 📸"} onPress={() => router.push({ pathname: "/capture/[dayId]", params: { dayId, hourIndex: String(clock.current) } } as any)} />
            )}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable testID="day-done" onPress={() => router.replace("/")} style={{ flex: 1, height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: C.hair }}>
                <Text style={{ fontFamily: F.sansMedium, fontSize: 17, color: "#111111" }}>Done</Text>
              </Pressable>
              <Pressable testID="open-recap" onPress={() => router.push(("/recap/" + dayId) as any)} style={{ flex: 1, height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#2F6FDB" }}>
                <Text style={{ fontFamily: F.sansMedium, fontSize: 17, color: "#FFFFFF" }}>See the recap</Text>
              </Pressable>
            </View>
            {day.type === "creator" && day.joinCode && day.creatorId === userId && (
              <Button title="Share fan join link" variant="whop" onPress={() => router.push(("/c/" + day.joinCode) as any)} />
            )}
            {canSnap && !clock.ended && <Button title="End Day now" variant="ghost" onPress={() => end({ dayId })} />}
          </>
        );
      })()}
    </Screen>
  );
}
