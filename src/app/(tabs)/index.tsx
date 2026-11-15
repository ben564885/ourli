import { Platform, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { Avatar, Body, Card, Display, H2, Loading, Logo, Pill, Screen } from "@/components/ui";
import { Onboarding } from "@/components/onboarding";
import { Landing } from "@/components/landing";
import { C, F } from "@/lib/theme";
import { dayClock, formatCountdown, hourLabel, monthKey } from "@/lib/time";
import { useNow } from "@/lib/use-now";

function ActiveBanner({ day }: { day: any }) {
  const now = useNow();
  const clock = dayClock(day, now);
  const label = day.type === "creator" ? (day.title ?? "Creator Day") : day.groupName;
  return (
    <Card style={{ backgroundColor: C.sky, borderColor: C.skyLine }} onPress={() => router.push(("/day/" + day._id) as any)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: C.text, fontFamily: F.sansMedium, fontSize: 20 }}>{label}</Text>
        {day.type === "creator" && <Pill text="Creator Day" color={C.text} />}
      </View>
      <Text style={{ color: C.muted, fontFamily: F.serif, fontSize: 17 }}>
        {clock.notStarted
          ? "Starts in " + formatCountdown(clock.msLeft)
          : hourLabel(day.startHour + clock.current) + " · hour " + (clock.current + 1) + " of " + day.hourCount + " · next in " + formatCountdown(clock.msLeft)}
      </Text>
      <Text style={{ color: C.text, fontFamily: F.serifItalic, fontSize: 18 }}>Open Day →</Text>
    </Card>
  );
}

function HomeScreen() {
  const { userId, loading, setUserId } = useSession();
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const active = useQuery(api.days.activeForUser, userId ? { userId } : "skip");
  const recent = useQuery(api.days.byMonth, userId ? { userId, month: monthKey(new Date()) } : "skip") as
    | { date: string; dayId: string; coverPhotoUrl: string | null; type: string }[]
    | undefined;

  if (loading) return <Loading />;
  if (!userId || user === null) return <Onboarding />;
  if (user === undefined) return <Loading />;

  const feed = (recent ?? []).filter((d) => d.coverPhotoUrl).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <Pressable onLongPress={() => setUserId(null)} onPress={() => router.push("/calendar")}>
          <Avatar name={user.name} color={user.color} />
        </Pressable>
      </View>

      <View style={{ marginTop: 18, marginBottom: 6 }}>
        <Display lead="Hi," accent={user.name} />
        <Text style={{ fontFamily: F.sansMedium, fontSize: 15, color: C.text, marginTop: 10 }}>No filters. Just your hours, together.</Text>
      </View>

      {active?.map((d) => <ActiveBanner key={d._id} day={d} />)}
      {active?.length === 0 && (
        <Card onPress={() => router.push("/create")}>
          <Text style={{ fontFamily: F.sansMedium, fontSize: 19, color: C.text }}>No Day live right now</Text>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 17, color: C.muted }}>Start one with your friends →</Text>
        </Card>
      )}

      <H2 style={{ marginTop: 14 }}>Recent Days</H2>
      {feed.length === 0 ? (
        <Body muted>Your finished Days show up here, with a photo from each.</Body>
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
    </Screen>
  );
}

export default function Index() {
  const { userId, loading } = useSession();
  if (Platform.OS === "web" && !loading && !userId) return <Landing />;
  return <HomeScreen />;
}
