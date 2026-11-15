import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { Avatar, Body, Display, Loading, Pill, Screen } from "@/components/ui";
import { C, F } from "@/lib/theme";
import { hourLabel } from "@/lib/time";

export default function Creators() {
  const { userId } = useSession();
  const feed = useQuery(api.creators.feed, userId ? { userId } : "skip");
  if (!userId || feed === undefined) return <Loading />;
  return (
    <Screen>
      <View style={{ marginTop: 8 }}>
        <Display lead="Creator" accent="Days" />
        <Text style={{ fontFamily: F.sansMedium, fontSize: 15, color: C.text, marginTop: 10 }}>Spend a day with someone you follow.</Text>
      </View>
      {feed.length === 0 && <Body muted>No creator Days are live yet.</Body>}
      {feed.map((d) => (
        <Pressable
          key={d.dayId}
          testID={"creator-" + d.joinCode}
          onPress={() => router.push((d.joined ? "/day/" + d.dayId : "/c/" + d.joinCode) as any)}
          style={({ pressed }) => ({ borderRadius: 30, padding: 14, gap: 14, backgroundColor: C.card, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Avatar name={d.creator?.name ?? "?"} color={d.creator?.color ?? C.accent} avatarUrl={d.creator?.avatarUrl} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.sansMedium, fontSize: 18, color: C.text }}>{d.title}</Text>
              <Text style={{ fontFamily: F.serif, fontSize: 15, color: C.muted }}>
                {d.status === "active" ? "Live" : "Replay"} · {hourLabel(d.startHour)}–{hourLabel(d.endHour)} · {d.fanCount} {d.fanCount === 1 ? "fan" : "fans"}
              </Text>
            </View>
            {d.joined ? <Pill text="You're in" color={C.text} /> : <MaterialCommunityIcons name="crown" size={22} color={C.text} />}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1.6 }}>
              <Image source={d.preview ? { uri: d.preview } : undefined} style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 20, backgroundColor: C.card }} contentFit="cover" transition={150} />
              <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: F.sansMedium, fontSize: 12, color: C.text }}>{hourLabel(d.startHour)} · free preview</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {[0, 1].map((i) => (
                <View key={i} style={{ flex: 1, borderRadius: 18, overflow: "hidden", backgroundColor: C.sky }}>
                  {d.locked[i] && <Image source={{ uri: d.locked[i]! }} style={{ width: "100%", height: "100%" }} contentFit="cover" blurRadius={d.joined ? 0 : 35} />}
                  {!d.joined && (
                    <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.35)" }}>
                      <MaterialCommunityIcons name="lock" size={22} color={C.text} />
                      <Text style={{ fontFamily: F.sansMedium, fontSize: 11, color: C.text }}>{hourLabel(d.startHour + i + 1)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={{ height: 54, borderRadius: 999, backgroundColor: d.joined ? C.sky : C.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20 }}>
            {!d.joined && <MaterialCommunityIcons name="crown" size={20} color={C.onAccent} />}
            <Text style={{ fontFamily: F.sansMedium, fontSize: 17, color: d.joined ? C.text : C.onAccent }}>{d.joined ? "Open the Day" : "Unlock full day"}</Text>
            {!d.joined && <Text style={{ fontFamily: F.serifItalic, fontSize: 16, color: C.onAccent, opacity: 0.7 }}>free pass</Text>}
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
