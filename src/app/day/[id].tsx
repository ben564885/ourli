import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { useNow } from "@/lib/use-now";
import { dayClock, formatCountdown, hourLabel } from "@/lib/time";
import { C } from "@/lib/theme";
import { Body, Button, H1, Loading, Pill, Screen } from "@/components/ui";
import { HourReveal } from "@/components/hour-reveal";

export default function DayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dayId = id as Id<"days">;
  const { userId } = useSession();
  const day = useQuery(api.days.get, { dayId });
  const end = useMutation(api.days.end);
  const now = useNow();
  const [picked, setPicked] = useState<number | null>(null);

  if (day === undefined || !userId) return <Loading />;
  if (day === null) return <Screen><H1>Day not found</H1></Screen>;

  const clock = dayClock(day, now);
  const hour = picked ?? clock.current;
  const tick = Math.floor((now - day.startAt) / day.slotMs);
  const title = day.type === "creator" ? (day.title ?? "Creator Day") : day.groupName;

  return (
    <Screen>
      <Button title="← Home" variant="ghost" style={{ alignSelf: "flex-start", height: 36, paddingHorizontal: 0 }} onPress={() => router.replace("/")} />
      {day.type === "creator" && <Pill text={"Creator Day with " + (day.creator?.name ?? "")} color={C.whop} />}
      <H1>{title}</H1>
      <Body muted>
        {clock.ended
          ? "This Day is over. Here's how it went."
          : clock.notStarted
            ? "Starts at " + hourLabel(day.startHour) + " · in " + formatCountdown(clock.msLeft)
            : hourLabel(day.startHour + clock.current) + " · hour " + (clock.current + 1) + " of " + day.hourCount + " · " + formatCountdown(clock.msLeft) + " left"}
      </Body>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {Array.from({ length: day.hourCount }, (_, i) => {
          const future = !clock.ended && i > clock.current;
          const active = i === hour;
          return (
            <Pressable
              key={i}
              disabled={future}
              onPress={() => setPicked(i)}
              style={{ paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: "center", backgroundColor: active ? C.accent : C.card, opacity: future ? 0.35 : 1 }}>
              <Text style={{ color: active ? "#fff" : C.text, fontWeight: "700" }}>{hourLabel(day.startHour + i)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <HourReveal dayId={dayId} hourIndex={hour} userId={userId} tick={tick} />

      {!clock.ended && !clock.notStarted && hour === clock.current && (
        <Button testID="snap" title={"Snap " + hourLabel(day.startHour + clock.current) + " 📸"} onPress={() => router.push({ pathname: "/capture/[dayId]", params: { dayId, hourIndex: String(clock.current) } } as any)} />
      )}
      <Button testID="open-recap" title="See the recap" variant="secondary" onPress={() => router.push(("/recap/" + dayId) as any)} />
      {day.type === "creator" && day.joinCode && day.creatorId === userId && (
        <Button title="Share fan join link" variant="whop" onPress={() => router.push(("/c/" + day.joinCode) as any)} />
      )}
      {!clock.ended && (
        <Button title="End Day now" variant="ghost" onPress={() => end({ dayId })} />
      )}
    </Screen>
  );
}
