import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { Avatar, GroupBadge, Loading, Pill } from "@/components/ui";
import { Onboarding } from "@/components/onboarding";
import { Landing } from "@/components/landing";
import { Ionicons } from "@expo/vector-icons";
import { C, F, useTheme } from "@/lib/theme";
import { dayClock, formatCountdown, hourLabel, monthKey } from "@/lib/time";
import { useNow } from "@/lib/use-now";

const K = C;

function DCard({ children, style, onPress }: { children: React.ReactNode; style?: object; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [{ backgroundColor: K.bg, borderRadius: 28, padding: 18, gap: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: K.line, opacity: pressed ? 0.85 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

function ActiveBanner({ day }: { day: any }) {
  return (
    <DCard style={{ backgroundColor: K.sky, borderColor: K.skyLine, paddingVertical: 14, paddingHorizontal: 18, gap: 0 }} onPress={() => router.push(("/day/" + day._id) as any)}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: K.text, fontFamily: F.sansMedium, fontSize: 17 }}>{day.title ?? "Creator Day"}</Text>
        <Text style={{ color: K.muted, fontFamily: F.serifItalic, fontSize: 15 }}>Creator Day</Text>
        <Ionicons name="arrow-up-outline" size={18} color={K.text} style={{ transform: [{ rotate: "45deg" }] }} />
      </View>
    </DCard>
  );
}

function GroupStack({ groups }: { groups: any[] }) {
  const now = useNow();
  const lead = groups[0].activeDay;
  const clock = dayClock(lead, now);
  const peek = 34;
  const n = Math.min(groups.length, 4);
  return (
    <Pressable
      testID="snap-stack"
      onPress={() => router.push({ pathname: "/capture/[dayId]", params: { dayId: lead._id, hourIndex: String(clock.current), all: "1" } } as any)}
      style={({ pressed }) => ({ height: 150 + (n - 1) * peek, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      {groups.slice(0, n).map((g, i) => {
        const front = i === 0;
        return (
          <View
            key={g._id}
            style={{
              position: "absolute",
              left: i * 12,
              right: i * 12,
              top: (n - 1 - i) * peek,
              height: front ? 150 : 150,
              borderRadius: 30,
              backgroundColor: front ? K.sky : K.card,
              borderWidth: 1.5,
              borderColor: front ? K.skyLine : K.line,
              padding: 16,
              zIndex: n - i,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <GroupBadge color={g.color} icon={g.icon} size={front ? 40 : 24} />
              <Text style={{ color: K.text, fontFamily: F.sansMedium, fontSize: front ? 20 : 15, flex: 1 }}>{front && groups.length > 1 ? "Snap to your groups" : g.name}</Text>
              {front && <Pill text="Live" color={K.text} />}
            </View>
            {front && (
              <>
                <Text style={{ color: K.muted, fontFamily: F.serif, fontSize: 17, marginTop: 14 }}>
                  {clock.notStarted ? "Starts in " + formatCountdown(clock.msLeft) : hourLabel(lead.startHour + clock.current) + " · hour " + (clock.current + 1) + " of " + lead.hourCount + " · next in " + formatCountdown(clock.msLeft)}
                </Text>
                <Text style={{ color: K.text, fontFamily: F.serifItalic, fontSize: 19, marginTop: 8 }}>Take a photo, then pick who gets it →</Text>
              </>
            )}
          </View>
        );
      })}
    </Pressable>
  );
}

function HomeScreen() {
  const { userId, loading, setUserId } = useSession();
  const [menu, setMenu] = useState(false);
  const { mode, toggle } = useTheme();
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const active = useQuery(api.days.activeForUser, userId ? { userId } : "skip");
  const myGroups = useQuery(api.groups.mine, userId ? { userId } : "skip");
  const liveGroups = (myGroups ?? []).filter((g) => g.activeDay);
  const recent = useQuery(api.days.byMonth, userId ? { userId, month: monthKey(new Date()) } : "skip") as
    | { date: string; dayId: string; coverPhotoUrl: string | null; type: string }[]
    | undefined;

  if (loading) return <Loading />;
  if (!userId || user === null) return <Onboarding />;
  if (user === undefined) return <Loading />;

  const feed = (recent ?? []).filter((d) => d.coverPhotoUrl).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: K.bg }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 130, gap: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 34, fontFamily: F.sansBold, color: K.text, letterSpacing: -1.4 }}>ourli</Text>
        <View style={{ zIndex: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable testID="theme-toggle" accessibilityLabel="Toggle theme" onPress={toggle} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderStyle: "dashed", borderColor: K.line, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={mode === "dark" ? "sunny-outline" : "moon-outline"} size={20} color={K.text} />
          </Pressable>
          <Pressable testID="avatar" accessibilityLabel="Profile menu" onPress={() => setMenu((m) => !m)}>
            <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} />
          </Pressable>
          {menu && (
            <View style={{ position: "absolute", top: 46, right: 0, width: 200, backgroundColor: C.card, borderRadius: 20, borderWidth: 1.5, borderStyle: "dashed", borderColor: K.line, paddingVertical: 6, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
              <Text style={{ fontFamily: F.sans, fontSize: 13, color: K.muted, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>{user.name}</Text>
              <Pressable testID="back-to-welcome" onPress={() => { setMenu(false); setUserId(null); }} style={{ paddingHorizontal: 16, height: 46, justifyContent: "center" }}>
                <Text style={{ fontFamily: F.sansMedium, fontSize: 16, color: K.text }}>Back to welcome</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={{ marginTop: 18, marginBottom: 6 }}>
        <Text style={{ color: K.text, fontSize: 40, lineHeight: 43, fontFamily: F.sansMedium, letterSpacing: -1.4 }}>Hi, <Text style={{ fontFamily: F.serifItalic, fontSize: 41.6 }}>{user.name}</Text></Text>
        <Text style={{ fontFamily: F.sansMedium, fontSize: 15, color: K.text, marginTop: 10 }}>No filters. Just your hours, together.</Text>
      </View>

      {liveGroups.length > 0 && <GroupStack groups={liveGroups} />}
      {active?.filter((d) => d.type === "creator").map((d) => <ActiveBanner key={d._id} day={d} />)}
      {active?.length === 0 && liveGroups.length === 0 && (
        <DCard onPress={() => router.push("/create")}>
          <Text style={{ fontFamily: F.sansMedium, fontSize: 19, color: K.text }}>No Day live right now</Text>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 17, color: K.muted }}>Start one with your friends →</Text>
        </DCard>
      )}

      <Text style={{ marginTop: 14, color: K.text, fontSize: 22, fontFamily: F.sansMedium, letterSpacing: -0.5 }}>Recent Days</Text>
      {feed.length === 0 ? (
        <Text style={{ color: K.muted, fontSize: 15, lineHeight: 21, fontFamily: F.sans }}>Your finished Days show up here, with a photo from each.</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {feed.map((d) => (
            <Pressable key={d.dayId} onPress={() => router.push(("/recap/" + d.dayId) as any)} style={{ width: "31.5%", aspectRatio: 3 / 4, borderRadius: 20, overflow: "hidden" }}>
              <Image source={{ uri: d.coverPhotoUrl! }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
              <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)" }} />
              <Text style={{ position: "absolute", left: 10, bottom: 8, color: "#fff", fontFamily: F.sansMedium, fontSize: 13 }}>{d.date.slice(5).replace("-", "/")}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <DCard style={{ flex: 1 }} onPress={() => router.push("/groups")}>
          <Text style={{ fontFamily: F.sansMedium, fontSize: 18, color: K.text }}>Groups</Text>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 16, color: K.muted }}>Join or create →</Text>
        </DCard>
        <DCard style={{ flex: 1, backgroundColor: K.sky, borderColor: K.skyLine }} onPress={() => router.push("/creators" as any)}>
          <Text style={{ fontFamily: F.sansMedium, fontSize: 18, color: K.text }}>Creator Days</Text>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 16, color: K.muted }}>Preview hour one →</Text>
        </DCard>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Index() {
  const { userId, loading } = useSession();
  if (Platform.OS === "web" && !loading && !userId) return <Landing />;
  return <HomeScreen />;
}
