import { useRef } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { C } from "@/lib/theme";
import { localDate, monthKey, pad } from "@/lib/time";

const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Entry = { date: string; dayId: string; type: "group" | "creator"; status: string; coverPhotoUrl: string | null };

function cellsFor(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(year, month, 1 - lead + i);
    return { d, inMonth: d.getMonth() === month };
  });
}

function Month({ year, month, cell, userId, groupId }: { year: number; month: number; cell: number; userId: Id<"users">; groupId?: Id<"groups"> }) {
  const key = year + "-" + pad(month + 1);
  const entries = useQuery(api.days.byMonth, { userId, month: key, groupId }) as Entry[] | undefined;
  const byDate = new Map((entries ?? []).map((e) => [e.date, e]));
  const today = localDate();
  const tile = cell - 8;
  return (
    <View style={{ marginBottom: 48 }}>
      <Text style={{ color: C.text, fontSize: 40, fontWeight: "800", marginTop: 12, marginBottom: 28, letterSpacing: -0.5 }}>{MONTHS[month]}</Text>
      <View style={{ flexDirection: "row", marginBottom: 18 }}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={{ width: cell, textAlign: "center", color: C.faint, fontSize: 12, letterSpacing: 1.5 }}>{w}</Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cellsFor(year, month).map(({ d, inMonth }, i) => {
          const ds = localDate(d);
          const entry = inMonth ? byDate.get(ds) : undefined;
          const isToday = inMonth && ds === today;
          const hasPhoto = !!entry?.coverPhotoUrl;
          const live = isToday && entry?.status === "active";
          return (
            <Pressable
              key={i}
              testID={inMonth ? "cal-" + ds : undefined}
              disabled={!entry}
              onPress={() => entry && router.push(("/recap/" + entry.dayId) as any)}
              style={{ width: cell, height: cell + 12, alignItems: "center", justifyContent: "center" }}>
              {hasPhoto ? (
                <View style={{ width: tile, height: tile, borderRadius: 11, overflow: "hidden", borderWidth: live ? 2 : 0, borderColor: C.accent }}>
                  <Image source={{ uri: entry!.coverPhotoUrl! }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
                  <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />
                </View>
              ) : isToday ? (
                <View style={{ width: tile, height: tile, borderRadius: tile / 2, backgroundColor: C.accent }} />
              ) : null}
              <Text
                style={{
                  position: "absolute",
                  color: inMonth ? C.text : C.faint,
                  opacity: inMonth ? 1 : 0.5,
                  fontSize: 16,
                  fontWeight: "500",
                }}>
                {d.getDate()}
              </Text>
              {entry?.type === "creator" && (
                <View style={{ position: "absolute", bottom: 6, width: 5, height: 5, borderRadius: 3, backgroundColor: C.accentSoft }} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Calendar() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { userId } = useSession();
  const { width } = useWindowDimensions();
  const scroll = useRef<any>(null);
  const cardPad = 24;
  const cardWidth = width - 24;
  const cell = Math.floor((cardWidth - cardPad * 2) / 7);
  const now = new Date();
  const months = [-2, -1, 0, 1].map((o) => new Date(now.getFullYear(), now.getMonth() + o, 1));
  if (!userId) return null;
  return (
    <View style={{ flex: 1, backgroundColor: C.accent }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }} edges={["top", "left", "right"]}>
        <View style={{ flex: 1, backgroundColor: C.card, borderTopLeftRadius: 44, borderTopRightRadius: 44, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: cardPad, paddingTop: 28, paddingBottom: 8 }}>
            <Pressable accessibilityLabel="Menu" onPress={() => router.back()} style={{ gap: 6, padding: 4 }}>
              <View style={{ width: 26, height: 2, backgroundColor: C.text, borderRadius: 1 }} />
              <View style={{ width: 26, height: 2, backgroundColor: C.text, borderRadius: 1 }} />
            </Pressable>
            <Pressable accessibilityLabel="More" onPress={() => router.replace("/")} style={{ gap: 3, padding: 6 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.text }} />
              ))}
            </Pressable>
          </View>
          <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: cardPad, paddingBottom: 80 }}>
            {months.map((m, i) => (
              <View
                key={monthKey(m)}
                onLayout={(e) => {
                  if (i === 2) scroll.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: false });
                }}>
                <Month year={m.getFullYear()} month={m.getMonth()} cell={cell} userId={userId} groupId={groupId as Id<"groups"> | undefined} />
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}
