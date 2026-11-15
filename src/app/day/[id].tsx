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

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, marginTop: 4 }}>
        <Text style={{ color: C.text, fontFamily: F.sansMedium, fontSize: 56, lineHeight: 60, letterSpacing: -2 }}>{hourLabel(day.startHour + hour)}</Text>
        <Text style={{ color: C.muted, fontFamily: F.serifItalic, fontSize: 22 }}>{!clock.ended && hour === clock.current && !clock.notStarted ? "happening now" : "hour " + (hour + 1)}</Text>
      </View>

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
