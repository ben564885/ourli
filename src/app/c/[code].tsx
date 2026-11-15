import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";
import QRCode from "react-native-qrcode-svg";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";
import { hourLabel } from "@/lib/time";
import { Loading, Logo } from "@/components/ui";

const SITE = process.env.EXPO_PUBLIC_CONVEX_SITE_URL!;
const WEB = process.env.EXPO_PUBLIC_WEB_URL;
const PASS_URL = "https://whop.com/checkout/plan_CP6L8nLZEpYib";
const PAPER = C.cardHi;

const MESSAGES: Record<string, string> = {
  no_access: "That Whop account doesn't have the pass yet. Grab it free, then try again.",
  error: "Whop sign-in hit a snag. Try again.",
  cancelled: "Whop sign-in was cancelled.",
  not_configured: "Whop isn't connected on the backend yet. Use the demo join below.",
};

function Fade() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: PAPER, opacity: (i + 1) / 10 }} />
      ))}
    </View>
  );
}

function Tile({ label, value, size }: { label: string; value: string; size: number }) {
  return (
    <View style={{ width: size, height: size * 0.78, borderRadius: 22, backgroundColor: C.hair, alignItems: "center", justifyContent: "center", gap: 4 }}>
      <Text style={{ fontFamily: F.sansMedium, fontSize: 22, color: C.text }}>{value}</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: 0.5, color: C.muted }}>{label}</Text>
    </View>
  );
}

export default function CreatorJoin() {
  const params = useLocalSearchParams<{ code: string; whop?: string }>();
  const code = params.code.toUpperCase();
  const { userId, setUserId, loading } = useSession();
  const day = useQuery(api.days.byJoinCode, { joinCode: code });
  const previews = useQuery(api.creators.previewByCode, { joinCode: code });
  const membership = useQuery(api.creator.membership, day && userId ? { dayId: day._id, userId } : "skip");
  const whop = useQuery(api.creator.whopConfigured);
  const createUser = useMutation(api.users.create);
  const joinDemo = useMutation(api.creator.joinDemo);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | undefined>(params.whop);
  const [busy, setBusy] = useState(false);
  const [width, setWidth] = useState(390);

  const isCreator = !!day && day.creatorId === userId;
  const joined = isCreator || !!membership;

  useEffect(() => {
    if (joined && day && !isCreator && status === "ok") router.replace(("/day/" + day._id) as any);
  }, [joined, day, isCreator, status]);

  if (loading || day === undefined || whop === undefined) return <Loading />;
  if (day === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: PAPER, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: F.sansBold, fontSize: 26, color: C.text }}>Creator Day not found</Text>
      </SafeAreaView>
    );
  }

  const webLink = (WEB ?? (Platform.OS === "web" ? globalThis.location?.origin : "")) + "/c/" + code;
  const creatorName = day.creator?.name ?? "your creator";
  const frameW = Math.min(width - 96, 330);
  const tile = (frameW - 32 - 20) / 3;

  async function ensureUser() {
    if (userId) return userId;
    const id = await createUser({ name: name || "Fan" });
    await setUserId(id);
    return id;
  }

  async function joinWithWhop() {
    setBusy(true);
    try {
      const uid = await ensureUser();
      const returnTo = Platform.OS === "web" ? globalThis.location.origin + "/c/" + code : ExpoLinking.createURL("/c/" + code);
      const url = SITE + "/whop/start?" + new URLSearchParams({ dayId: day!._id, userId: uid, returnTo });
      if (Platform.OS === "web") {
        globalThis.location.href = url;
        return;
      }
      const res = await WebBrowser.openAuthSessionAsync(url, returnTo);
      if (res.type === "success") setStatus(new URL(res.url).searchParams.get("whop") ?? "error");
    } finally {
      setBusy(false);
    }
  }

  const cta = (title: string, onPress: () => void, disabled?: boolean, testID?: string, crown?: boolean) => (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || busy}
      style={{ height: 68, borderRadius: 999, backgroundColor: C.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, opacity: disabled ? 0.4 : 1, shadowColor: "#000", shadowOpacity: crown ? 0.25 : 0, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
      {crown && !busy && <MaterialCommunityIcons name="crown" size={24} color={C.onAccent} />}
      <Text style={{ fontFamily: F.sansMedium, fontSize: 21, color: C.onAccent }}>{busy ? "One sec…" : title}</Text>
    </Pressable>
  );

  const linkStyle = { fontFamily: F.sansMedium, fontSize: 15, color: C.muted } as const;

  return (
    <View style={{ flex: 1, backgroundColor: PAPER }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 0 }} showsVerticalScrollIndicator={false}>
          <View style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 10, height: 64 }}>
            <Logo size={26} />
            <Pressable accessibilityLabel="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace("/creators" as any))} style={{ position: "absolute", right: 20, top: 10, width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.hair, backgroundColor: C.card, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22, color: C.text, marginTop: -2 }}>×</Text>
            </Pressable>
          </View>

          <View style={{ width: frameW, height: 360, marginTop: 24, borderTopLeftRadius: 52, borderTopRightRadius: 52, borderWidth: 8, borderBottomWidth: 0, borderColor: C.hair, overflow: "hidden", alignItems: "center", paddingTop: 14 }}>
            <View style={{ width: 96, height: 26, borderRadius: 14, backgroundColor: C.hair }} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 26 }}>
              <Tile size={tile} value={String(day.hourCount)} label="HOURS" />
              <Tile size={tile} value={String(day.fanCount)} label={day.fanCount === 1 ? "FAN" : "FANS"} />
              <Tile size={tile} value="Free" label="PASS" />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: tile, height: tile * 1.15, borderRadius: 22, overflow: "hidden" }}>
                  {previews?.[i] ? <Image source={{ uri: previews[i] }} style={{ width: "100%", height: "100%" }} contentFit="cover" blurRadius={i === 0 ? 0 : 40} /> : <View style={{ flex: 1, backgroundColor: C.cardHi }} />}
                  <View style={{ position: "absolute", top: 6, right: 6, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: F.sansMedium, fontSize: 9, color: C.text }}>{hourLabel(day.startHour + i)}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Fade />
          </View>

          <View style={{ paddingHorizontal: 28, marginTop: -64, alignItems: "center" }}>
            <Text style={{ fontFamily: F.sansMedium, fontSize: 40, lineHeight: 46, letterSpacing: -1.2, textAlign: "center", color: C.text }}>
              Spend the day{"\n"}with {creatorName}
            </Text>
            <Text style={{ fontFamily: F.sans, fontSize: 18, lineHeight: 26, color: C.faint, textAlign: "center", marginTop: 14 }}>
              Live {hourLabel(day.startHour)}–{hourLabel(day.endHour)}. Every hour you see their photo next to yours, and tonight you get a recap of your day together.
            </Text>
            <View style={{ flexDirection: "row", gap: 14, marginTop: 24, marginBottom: 22 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: i === 0 ? C.text : C.hair }} />
              ))}
            </View>
          </View>

          <View style={{ width: "100%", backgroundColor: "#fff", borderTopLeftRadius: 44, borderTopRightRadius: 44, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 34, gap: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 20 }}>
            <Text style={{ fontFamily: F.sansMedium, fontSize: 24, textAlign: "center", color: C.text }}>{isCreator ? "Share your Day" : joined ? "You're in" : day.title}</Text>

            {status && status !== "ok" && MESSAGES[status] && (
              <Text style={{ fontFamily: F.sans, fontSize: 15, textAlign: "center", color: C.danger }}>{MESSAGES[status]}</Text>
            )}

            {isCreator ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                {webLink.startsWith("http") && (
                  <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: C.hair }}>
                    <QRCode value={webLink} size={180} />
                  </View>
                )}
                <Text selectable style={{ fontFamily: F.sans, color: C.muted, fontSize: 13 }}>{webLink.startsWith("http") ? webLink : "Code " + code}</Text>
                <View style={{ alignSelf: "stretch" }}>{cta("Open my Day", () => router.replace(("/day/" + day._id) as any))}</View>
              </View>
            ) : joined ? (
              cta("Open the Day", () => router.replace(("/day/" + day._id) as any), false, "open-creator-day")
            ) : (
              <>
                {!userId && (
                  <TextInput
                    testID="fan-name-input"
                    placeholder="Your name"
                    placeholderTextColor={C.faint}
                    value={name}
                    onChangeText={setName}
                    style={{ backgroundColor: C.card, color: C.text, borderRadius: 999, height: 56, paddingHorizontal: 22, fontSize: 17, fontFamily: F.sans }}
                  />
                )}
                {cta("Unlock the full day", joinWithWhop, !userId && !name.trim(), "join-whop", true)}
                <View style={{ gap: 8, alignSelf: "center" }}>
                  {["Every hour, side by side with " + creatorName, "A recap of your day together", "Free pass · $0, checked through Whop"].map((t) => (
                    <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Ionicons name="checkmark-circle" size={20} color={C.text} />
                      <Text style={{ fontFamily: F.sans, fontSize: 15, color: C.muted }}>{t}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              {!isCreator && !joined && <Text onPress={() => Linking.openURL(PASS_URL)} style={linkStyle}>Get the free pass</Text>}
              {!isCreator && !joined && !whop.configured && (
                <>
                  <Text style={linkStyle}>·</Text>
                  <Text
                    onPress={async () => {
                      const uid = await ensureUser();
                      await joinDemo({ dayId: day._id, userId: uid });
                      router.replace(("/day/" + day._id) as any);
                    }}
                    style={linkStyle}>
                    Demo join
                  </Text>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
