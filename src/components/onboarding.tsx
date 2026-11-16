import { useEffect, useState } from "react";
import Animated2, { FadeIn, FadeOut } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { uploadAvatar } from "@/lib/upload";
import { localDate } from "@/lib/time";
import { Alert, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { C, F, themed } from "@/lib/theme";
import { Button } from "./ui";

type Chip = { t: string; emoji?: boolean; filled?: boolean };
const ROWS: Chip[][] = [
  [{ t: "Same hour, different lives", filled: true }, { t: "📸", emoji: true }, { t: "Snap every hour" }, { t: "☕️", emoji: true }, { t: "Hourly reveal" }],
  [{ t: "Build a group ritual" }, { t: "🌇", emoji: true }, { t: "See your friends' days", filled: true }, { t: "Recap at night" }, { t: "🎧", emoji: true }],
  [{ t: "Spend a day with a creator", filled: true }, { t: "🍜", emoji: true }, { t: "A calendar of memories" }, { t: "🫶", emoji: true }],
];

function ChipView({ c }: { c: Chip }) {
  return (
    <View style={[s.chip, c.emoji && s.emoji, c.filled && s.filled]}>
      <Text style={c.emoji ? { fontSize: 20 } : s.chipText}>{c.t}</Text>
    </View>
  );
}

function Marquee({ chips, reverse, duration }: { chips: Chip[]; reverse?: boolean; duration: number }) {
  const [x] = useState(() => new Animated.Value(0));
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!w) return;
    x.setValue(reverse ? -w : 0);
    const loop = Animated.loop(Animated.timing(x, { toValue: reverse ? 0 : -w, duration, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [w, reverse, duration, x]);
  const row = (k: string) => (
    <View key={k} style={s.row} onLayout={k === "a" ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {chips.map((c, i) => <ChipView key={i} c={c} />)}
    </View>
  );
  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: x }] }}>{[row("a"), row("b")]}</Animated.View>
    </View>
  );
}

export function Onboarding() {
  const { setUserId } = useSession();
  const create = useMutation(api.users.create);
  const join = useMutation(api.groups.join);
  const joinDemo = useMutation(api.demo.joinDemo);
  const genUrl = useMutation(api.captures.generateUploadUrl);
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState<"intro" | "name" | "code" | "photo">("intro");
  const [from, setFrom] = useState<"name" | "code">("name");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  }

  async function take() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return pick();
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, cameraType: ImagePicker.CameraType.front });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  }

  async function finish(skip = false) {
    setBusy(true);
    try {
      const avatarId = photo && !skip ? await uploadAvatar(photo, () => genUrl()) : undefined;
      const typed = code.trim().toUpperCase();
      if (!typed || typed === "OURLI1") {
        const now = new Date();
        const res = await joinDemo({ name, avatarId, localHour: now.getHours(), date: localDate(now) });
        await setUserId(res.userId);
        return;
      }
      const id = await create({ name, avatarId });
      try {
        const groupId = await join({ inviteCode: typed, userId: id });
        await setUserId(id);
        router.push(("/group/" + groupId) as any);
        return;
      } catch {
        Alert.alert("Couldn't find that group", "You're signed up. Join from the Groups tab with the right code.");
      }
      await setUserId(id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {step === "photo" ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 44 }}>
              <Pressable testID="photo-back" accessibilityLabel="Back" onPress={() => setStep(from)} hitSlop={12}>
                <Ionicons name="chevron-back" size={28} color={C.text} />
              </Pressable>
              <Pressable testID="photo-skip" onPress={() => { setPhoto(null); finish(true); }} hitSlop={12}>
                <Text style={{ fontFamily: F.sansMedium, fontSize: 17, color: C.text }}>Skip</Text>
              </Pressable>
            </View>
            <Text style={{ fontFamily: F.sansMedium, fontSize: 40, lineHeight: 44, letterSpacing: -1.4, color: C.text, marginTop: 18 }}>Upload your <Text style={{ fontFamily: F.serifItalic, fontSize: 42 }}>photo</Text></Text>
            <Text style={{ fontFamily: F.sans, fontSize: 16, lineHeight: 22, color: C.muted, marginTop: 8 }}>Choose a profile picture so your friends know it's you.</Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingTop: step === "intro" ? 72 : 40, paddingHorizontal: 24 }}>
            <Text style={s.h1}>Let's share</Text>
            <Text style={s.h1Serif}>your day</Text>
            <Text style={s.h1}>hour by hour</Text>
            <Text style={s.sub}>{step === "intro" ? "No filters. Just your hours, together." : step === "code" ? "Your name, then the code your friend sent." : "What should your friends call you?"}</Text>
          </View>
        )}

        <Animated2.View key={step} entering={FadeIn.duration(300)} exiting={FadeOut.duration(120)}>
        {step === "intro" ? (
          <View style={{ gap: 14, marginTop: 44 }}>
            <Marquee chips={ROWS[0]} duration={26000} />
            <Marquee chips={ROWS[1]} duration={32000} reverse />
            <Marquee chips={ROWS[2]} duration={28000} />
          </View>
        ) : step === "photo" ? (
          <View style={{ alignItems: "center", marginTop: 56 }}>
            <Pressable testID="pick-avatar" onPress={pick} style={{ width: 230, height: 230, borderRadius: 115, borderWidth: 2, borderStyle: "dashed", borderColor: C.line, backgroundColor: C.card, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {photo ? <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <Ionicons name="person-outline" size={110} color={C.text} />}
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 36, paddingHorizontal: 24 }}>
            <TextInput testID="name-input" placeholder="Your name" placeholderTextColor={C.faint} value={name} onChangeText={setName} style={s.input} autoFocus />
            {step === "code" && (
              <TextInput testID="onboard-code-input" placeholder="JUDGES USE OURLI1" autoCapitalize="characters" placeholderTextColor={C.faint} value={code} onChangeText={setCode} style={s.input} />
            )}
          </View>
        )}
        </Animated2.View>

        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 6 }}>
          {step === "intro" ? (
            <>
              <Button testID="get-started" title="Get started with an invite code" onPress={() => setStep("code")} />
            </>
          ) : (
            <>
              {step === "photo" ? (
                <>
                  {photo ? (
                    <>
                      <Button testID="onboard-finish" title="Let's go" loading={busy} onPress={() => finish()} />
                      <Pressable onPress={pick} style={{ height: 56, borderRadius: 999, borderWidth: 1.5, borderColor: C.text, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: F.sansMedium, fontSize: 17, color: C.text }}>Choose a different photo</Text></Pressable>
                    </>
                  ) : (
                    <>
                      <Button testID="take-photo" title="Take photo" onPress={take} />
                      <Pressable testID="select-photo" onPress={pick} style={{ height: 56, borderRadius: 999, borderWidth: 1.5, borderColor: C.text, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: F.sansMedium, fontSize: 17, color: C.text }}>Select photo</Text></Pressable>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button testID="onboard-continue" title="Continue" disabled={!name.trim() || (step === "code" && code.trim().length < 4)} onPress={() => { setFrom(step as "name" | "code"); setStep("photo"); }} />
                  <Pressable onPress={() => setStep("intro")} style={{ height: 52, alignItems: "center", justifyContent: "center" }}>
                    <Text style={s.link}>Back</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = themed(() => StyleSheet.create({
  h1: { fontFamily: F.sansMedium, fontSize: 50, lineHeight: 54, letterSpacing: -1.8, color: C.text, textAlign: "center" },
  h1Serif: { fontFamily: F.serifItalic, fontSize: 52, lineHeight: 54, letterSpacing: -1, color: C.text, textAlign: "center" },
  sub: { fontFamily: F.sansMedium, fontSize: 15, color: C.text, marginTop: 18, textAlign: "center" },
  row: { flexDirection: "row", gap: 10, paddingRight: 10 },
  chip: { height: 50, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.line, justifyContent: "center", backgroundColor: C.bg },
  emoji: { width: 50, paddingHorizontal: 0, alignItems: "center" },
  filled: { backgroundColor: C.sky, borderColor: C.skyLine },
  chipText: { fontFamily: F.serif, fontSize: 17, color: C.text },
  input: { backgroundColor: C.bg, color: C.text, borderRadius: 999, height: 56, paddingHorizontal: 22, fontSize: 17, fontFamily: F.sans, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.line },
  link: { fontFamily: F.sansMedium, fontSize: 16, color: C.text },
}));
