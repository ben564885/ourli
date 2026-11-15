import { useRef } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { F } from "@/lib/theme";
import { localDate, monthKey, pad } from "@/lib/time";

const K = { bg: "#0B0B0D", text: "#FFFFFF", muted: "#8B8D94", faint: "#4A4C53", line: "#1F2024", accentSoft: "#9DB8F0" };
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

function Month({ year, month, cell, userId, groupId, onToday }: { year: number; month: number; cell: number; userId: Id<"users">; groupId?: Id<"groups">; onToday?: (y: number) => void }) {
  const gridY = useRef(0);
  const key = year + "-" + pad(month + 1);
  const entries = useQuery(api.days.byMonth, { userId, month: key, groupId }) as Entry[] | undefined;
  const byDate = new Map((entries ?? []).map((e) => [e.date, e]));
  const today = localDate();
  const tile = cell - 8;
  return (
    <View style={{ marginBottom: 48 }}>
      <Text style={{ color: K.text, fontSize: 40, fontFamily: F.sansMedium, marginTop: 12, marginBottom: 28, letterSpacing: -1.4 }}>{MONTHS[month]}</Text>
      <View style={{ flexDirection: "row", marginBottom: 18 }}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={{ width: cell, textAlign: "center", color: K.muted, fontSize: 12, letterSpacing: 1.5 }}>{w}</Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }} onLayout={(e) => { gridY.current = e.nativeEvent.layout.y; }}>
        {cellsFor(year, month).map(({ d, inMonth }, i) => {
          const ds = localDate(d);
          const entry = inMonth ? byDate.get(ds) : undefined;
          const isToday = inMonth && ds === today;
          const hasPhoto = !!entry?.coverPhotoUrl;
                    return (
            <Pressable
              key={i}
              testID={inMonth ? "cal-" + ds : undefined}
              disabled={!entry}
              onLayout={isToday ? (e) => onToday?.(gridY.current + e.nativeEvent.layout.y) : undefined}
              onPress={() => entry && router.push(("/recap/" + entry.dayId) as any)}
              style={{ width: cell, height: cell + 12, alignItems: "center", justifyContent: "center" }}>
              {hasPhoto ? (
                <View style={{ width: tile, height: tile, borderRadius: 11, overflow: "hidden", borderWidth: isToday ? 2.5 : 0, borderColor: "#fff" }}>
                  <Image source={{ uri: entry!.coverPhotoUrl! }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
                  <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />
                </View>
              ) : isToday ? (
                <View style={{ width: tile, height: tile, borderRadius: tile / 2, backgroundColor: "#fff" }} />
              ) : null}
              <Text
                style={{
                  position: "absolute",
                  color: isToday && !hasPhoto ? "#000" : hasPhoto ? "#fff" : inMonth ? K.text : K.faint,
                  opacity: inMonth ? 1 : 0.5,
                  fontSize: 16,
                  fontFamily: isToday ? F.sansBold : F.sansMedium,
                }}>
                {d.getDate()}
              </Text>
              {entry?.type === "creator" && (
                <View style={{ position: "absolute", bottom: 6, width: 5, height: 5, borderRadius: 3, backgroundColor: K.accentSoft }} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Calendar() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { userId } = useSession();
  const { width } = useWindowDimensions();
  const scroll = useRef<any>(null);
  const pos = useRef({ month: -1, today: -1, done: false });
  const cardPad = 20;
  const cell = Math.floor((width - cardPad * 2) / 7);
  const now = new Date();
  const months = [-2, -1, 0, 1].map((o) => new Date(now.getFullYear(), now.getMonth() + o, 1));
  const goToday = (animated = false) => {
    const { month, today } = pos.current;
    if (month < 0 || today < 0) return;
    scroll.current?.scrollTo({ y: Math.max(0, month + today - 150), animated });
    pos.current.done = true;
  };
  if (!userId) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: K.bg }} edges={["top", "left", "right"]}>
      <View style={{ paddingHorizontal: cardPad, paddingTop: 10, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: K.line }}>
        <View>
          <Text style={{ fontFamily: F.sans, fontSize: 12, letterSpacing: 1.5, color: K.muted }}>TODAY</Text>
          <Text style={{ fontFamily: F.sansMedium, fontSize: 22, color: K.text, letterSpacing: -0.5 }}>
            {DAYS[now.getDay()]}, {MONTHS[now.getMonth()].slice(0, 3)} {now.getDate()}
          </Text>
        </View>
        <Pressable testID="cal-today" onPress={() => goToday(true)} style={{ height: 38, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "#fff", justifyContent: "center" }}>
          <Text style={{ fontFamily: F.sansMedium, fontSize: 14, color: "#000" }}>Today</Text>
        </Pressable>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: cardPad, paddingBottom: 40, paddingTop: 12 }}>
        {months.map((m, i) => (
          <View
            key={monthKey(m)}
            onLayout={(e) => {
              if (i !== 2) return;
              pos.current.month = e.nativeEvent.layout.y;
              if (!pos.current.done) goToday();
            }}>
            <Month
              year={m.getFullYear()}
              month={m.getMonth()}
              cell={cell}
              userId={userId}
              groupId={groupId as Id<"groups"> | undefined}
              onToday={i === 2 ? (y) => { pos.current.today = y; if (!pos.current.done) goToday(); } : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
