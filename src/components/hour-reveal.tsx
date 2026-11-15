import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { C } from "@/lib/theme";
import { Avatar, Photo } from "./ui";

export function HourReveal({ dayId, hourIndex, userId, tick }: { dayId: Id<"days">; hourIndex: number; userId: Id<"users">; tick: number }) {
  const data = useQuery(api.captures.byHour, { dayId, hourIndex, userId, tick });
  if (!data) return <View style={{ height: 220 }} />;
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: C.muted, fontSize: 13 }}>
        {data.revealed ? "Revealed" : "Hidden until you post"} · {data.postedCount}/{data.members.length} posted
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {data.members.map((m) => (
          <View key={m.user._id} style={{ width: "48.5%", gap: 8 }}>
            <Pressable disabled={!m.captureId} onPress={() => router.push(("/photo/" + m.captureId) as any)}>
              <Photo uri={m.url} blur={!data.revealed} style={{ width: "100%", aspectRatio: 3 / 4 }} />
              {m.commentCount > 0 && (
                <View style={{ position: "absolute", right: 6, bottom: 6, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>💬 {m.commentCount}</Text>
                </View>
              )}
              {!m.url && (
                <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: m.posted ? C.accentSoft : C.faint, fontWeight: "700" }}>{m.posted ? "posted 🔒" : "waiting…"}</Text>
                </View>
              )}
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Avatar name={m.user.name} color={m.user.color} size={24} avatarUrl={m.user.avatarUrl} />
              <Text numberOfLines={1} style={{ color: C.text, fontSize: 14, flex: 1 }}>{m.user._id === userId ? "You" : m.user.name}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
