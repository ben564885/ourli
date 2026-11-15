import { useRef, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { C } from "@/lib/theme";
import { hourLabel } from "@/lib/time";
import { Avatar, Button, H1, Loading, Logo, Photo, Screen } from "@/components/ui";

export default function Recap() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useSession();
  const data = useQuery(api.days.recap, userId ? { dayId: id as Id<"days">, userId } : "skip");
  const shot = useRef<any>(null);
  const [exporting, setExporting] = useState(false);

  if (data === undefined) return <Loading />;
  if (data === null) return <Screen><H1>Recap not available</H1></Screen>;

  const { day, users, rows } = data;
  const title = day.type === "creator" ? (day.title ?? "Creator Day") : day.groupName;

  return (
    <Screen>
      <Button title="← Back" variant="ghost" style={{ alignSelf: "flex-start", height: 36, paddingHorizontal: 0 }} onPress={() => router.back()} />
      <View ref={shot} collapsable={false} style={{ backgroundColor: C.bg, gap: 12, paddingVertical: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View>
            <Text style={{ color: C.text, fontSize: 28, fontWeight: "800" }}>{title}</Text>
            <Text style={{ color: C.muted }}>{day.date} · {hourLabel(day.startHour)}–{hourLabel(day.endHour)}</Text>
          </View>
          <Logo size={22} />
        </View>
        <View style={{ flexDirection: "row", gap: 6, paddingLeft: 52 }}>
          {users.map((u) => (
            <View key={u._id} style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <Avatar name={u.name} color={u.color} size={28} avatarUrl={u.avatarUrl} />
              <Text numberOfLines={1} style={{ color: C.text, fontSize: 12, fontWeight: "600" }}>{u._id === userId ? "You" : u.name}</Text>
            </View>
          ))}
        </View>
        {rows.map((r) => (
          <View key={r.hourIndex} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Text style={{ width: 46, color: C.muted, fontSize: 12, fontWeight: "700" }}>{hourLabel(r.hour)}</Text>
            {r.cells.map((cell) => (
              <Pressable
                key={cell.userId}
                disabled={!cell.captureId}
                onPress={() => router.push(("/photo/" + cell.captureId) as any)}
                style={{ flex: 1 }}>
                {cell.url ? (
                  <View>
                    <Photo uri={cell.thumbUrl ?? cell.url} style={{ width: "100%", aspectRatio: 3 / 4 }} />
                  </View>
                ) : (
                  <View style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: C.card, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: C.faint, fontSize: 11, fontWeight: "700" }}>{cell.posted ? "🔒" : r.closed ? "missed" : "—"}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      <Button
        testID="export-recap"
        title="Export collage"
        loading={exporting}
        onPress={async () => {
          if (Platform.OS === "web") {
            Alert.alert("Export works in the iOS app");
            return;
          }
          setExporting(true);
          try {
            const uri = await captureRef(shot, { format: "jpg", quality: 0.92 });
            await Sharing.shareAsync(uri, { mimeType: "image/jpeg", dialogTitle: "Share your ourli" });
          } finally {
            setExporting(false);
          }
        }}
      />
    </Screen>
  );
}
