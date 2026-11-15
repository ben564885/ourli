import { useEffect, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import QRCode from "react-native-qrcode-svg";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { C } from "@/lib/theme";
import { hourLabel } from "@/lib/time";
import { Avatar, Body, Button, Card, H1, Loading, Logo, Pill, Screen } from "@/components/ui";

const SITE = process.env.EXPO_PUBLIC_CONVEX_SITE_URL!;
const WEB = process.env.EXPO_PUBLIC_WEB_URL;

const MESSAGES: Record<string, string> = {
  no_access: "That Whop account doesn't have access to this Creator Day yet. Grab the free pass on Whop, then try again.",
  error: "Whop sign-in hit a snag. Try again.",
  cancelled: "Whop sign-in was cancelled.",
  not_configured: "Whop isn't connected on the backend yet. Use the demo join below.",
};

export default function CreatorJoin() {
  const params = useLocalSearchParams<{ code: string; whop?: string }>();
  const code = params.code.toUpperCase();
  const { userId, setUserId, loading } = useSession();
  const day = useQuery(api.days.byJoinCode, { joinCode: code });
  const membership = useQuery(api.creator.membership, day && userId ? { dayId: day._id, userId } : "skip");
  const whop = useQuery(api.creator.whopConfigured);
  const createUser = useMutation(api.users.create);
  const joinDemo = useMutation(api.creator.joinDemo);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | undefined>(params.whop);
  const [busy, setBusy] = useState(false);

  const isCreator = !!day && day.creatorId === userId;
  const joined = isCreator || !!membership;

  useEffect(() => {
    if (joined && day && !isCreator && status === "ok") router.replace(("/day/" + day._id) as any);
  }, [joined, day, isCreator, status]);

  if (loading || day === undefined || whop === undefined) return <Loading />;
  if (day === null) return <Screen><H1>Creator Day not found</H1></Screen>;

  const webLink = (WEB ?? (Platform.OS === "web" ? globalThis.location?.origin : "")) + "/c/" + code;

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
      const returnTo = Platform.OS === "web" ? globalThis.location.origin + "/c/" + code : Linking.createURL("/c/" + code);
      const url = SITE + "/whop/start?" + new URLSearchParams({ dayId: day!._id, userId: uid, returnTo });
      if (Platform.OS === "web") {
        globalThis.location.href = url;
        return;
      }
      const res = await WebBrowser.openAuthSessionAsync(url, returnTo);
      if (res.type === "success") {
        const result = new URL(res.url).searchParams.get("whop") ?? "error";
        setStatus(result);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size={26} />
        <Pill text="Creator Day" color={C.whop} />
      </View>
      <View style={{ alignItems: "center", gap: 10, marginTop: 12 }}>
        <Avatar name={day.creator?.name ?? "?"} color={day.creator?.color ?? C.accent} size={88} />
        <H1 style={{ textAlign: "center" }}>{day.title}</H1>
        <Body muted style={{ textAlign: "center" }}>
          with {day.creator?.name} · live today {hourLabel(day.startHour)}–{hourLabel(day.endHour)} · {day.fanCount} {day.fanCount === 1 ? "fan" : "fans"}
        </Body>
      </View>
      <Body muted style={{ textAlign: "center" }}>Every hour you'll see {day.creator?.name}'s photo next to yours. Tonight you get a recap of your day together.</Body>

      {status && status !== "ok" && MESSAGES[status] && (
        <Card style={{ borderWidth: 1, borderColor: C.whop }}>
          <Body>{MESSAGES[status]}</Body>
        </Card>
      )}

      {isCreator ? (
        <Card style={{ alignItems: "center" }}>
          <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Fans scan to join</Text>
          {webLink.startsWith("http") ? (
            <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: 16 }}>
              <QRCode value={webLink} size={200} />
            </View>
          ) : null}
          <Text selectable style={{ color: C.muted }}>{webLink.startsWith("http") ? webLink : "Code " + code}</Text>
          <Button title="Open my Day" onPress={() => router.replace(("/day/" + day._id) as any)} style={{ alignSelf: "stretch" }} />
        </Card>
      ) : joined ? (
        <Button testID="open-creator-day" title="You're in → open the Day" onPress={() => router.replace(("/day/" + day._id) as any)} />
      ) : (
        <Card>
          {!userId && (
            <TextInput
              testID="fan-name-input"
              placeholder="Your name"
              placeholderTextColor={C.faint}
              value={name}
              onChangeText={setName}
              style={{ backgroundColor: C.cardHi, color: C.text, borderRadius: 14, height: 50, paddingHorizontal: 16, fontSize: 16 }}
            />
          )}
          <Button testID="join-whop" title="Join with Whop" variant="whop" loading={busy} disabled={!userId && !name.trim()} onPress={joinWithWhop} />
          {!whop.configured && (
            <Button
              testID="join-demo"
              title="Join (demo mode)"
              variant="ghost"
              disabled={!userId && !name.trim()}
              onPress={async () => {
                const uid = await ensureUser();
                await joinDemo({ dayId: day._id, userId: uid });
                router.replace(("/day/" + day._id) as any);
              }}
            />
          )}
        </Card>
      )}
    </Screen>
  );
}
