import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { C } from "@/lib/theme";
import { hourLabel, timeOf } from "@/lib/time";
import { Avatar, Loading, Photo } from "@/components/ui";

export default function PhotoScreen() {
  const { captureId } = useLocalSearchParams<{ captureId: string }>();
  const { userId } = useSession();
  const data = useQuery(api.comments.forCapture, userId ? { captureId: captureId as Id<"captures">, userId } : "skip");
  const add = useMutation(api.comments.add);
  const [text, setText] = useState("");

  if (data === undefined || !userId) return <Loading />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 10 }}>
          <Pressable accessibilityLabel="Close" onPress={() => router.back()}>
            <Text style={{ color: C.accentSoft, fontSize: 16, fontWeight: "700" }}>Close</Text>
          </Pressable>
          {data && (
            <>
              <View style={{ flex: 1 }} />
              <Avatar name={data.author?.name ?? "?"} color={data.author?.color ?? C.accent} size={28} avatarUrl={data.author?.avatarUrl} />
              <Text style={{ color: C.text, fontWeight: "700" }}>{data.author?.name}</Text>
              <Text style={{ color: C.muted }}>{hourLabel(data.hour)} · {timeOf(data.takenAt)}</Text>
            </>
          )}
        </View>
        {data === null ? (
          <Text style={{ color: C.muted, padding: 20 }}>Post your own photo for this hour to see this one.</Text>
        ) : (
          <>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
              <Photo uri={data.url} style={{ width: "100%", aspectRatio: 3 / 4 }} />
              {data.comments.length === 0 && <Text style={{ color: C.muted }}>No comments yet. Say something nice.</Text>}
              {data.comments.map((c) => (
                <View key={c._id} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  <Avatar name={c.user?.name ?? "?"} color={c.user?.color ?? C.accent} size={28} avatarUrl={c.user?.avatarUrl} />
                  <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 10 }}>
                    <Text style={{ color: C.muted, fontSize: 12, fontWeight: "700" }}>{c.user?.name} · {timeOf(c._creationTime)}</Text>
                    <Text style={{ color: C.text, fontSize: 15, marginTop: 2 }}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.card }}>
              <TextInput
                testID="comment-input"
                value={text}
                onChangeText={setText}
                placeholder="Add a comment…"
                placeholderTextColor={C.faint}
                style={{ flex: 1, backgroundColor: C.card, color: C.text, borderRadius: 20, paddingHorizontal: 16, height: 42 }}
                onSubmitEditing={async () => {
                  if (!text.trim()) return;
                  await add({ captureId: captureId as Id<"captures">, userId, text });
                  setText("");
                }}
                returnKeyType="send"
              />
              <Pressable
                testID="comment-send"
                accessibilityLabel="Send comment"
                disabled={!text.trim()}
                onPress={async () => {
                  await add({ captureId: captureId as Id<"captures">, userId, text });
                  setText("");
                }}
                style={{ backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 16, justifyContent: "center", opacity: text.trim() ? 1 : 0.4 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
