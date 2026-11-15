import { useEffect, useState } from "react";
import Animated2, { FadeIn, FadeOut } from "react-native-reanimated";
import { Alert, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";
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
  const [step, setStep] = useState<"intro" | "name" | "code">("intro");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      const id = await create({ name });
      if (step === "code" && code.trim()) {
        try {
          const groupId = await join({ inviteCode: code, userId: id });
          await setUserId(id);
          router.push(("/group/" + groupId) as any);
          return;
        } catch {
          Alert.alert("Couldn't find that group", "You're signed up. Join from the home screen with the right code.");
        }
      }
      await setUserId(id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ alignItems: "center", paddingTop: step === "intro" ? 72 : 40, paddingHorizontal: 24 }}>
          <Text style={s.h1}>Let's share</Text>
          <Text style={s.h1Serif}>your day</Text>
          <Text style={s.h1}>hour by hour</Text>
          <Text style={s.sub}>{step === "intro" ? "No filters. Just your hours, together." : step === "code" ? "Your name, then the code your friend sent." : "What should your friends call you?"}</Text>
        </View>

        <Animated2.View key={step} entering={FadeIn.duration(300)} exiting={FadeOut.duration(120)}>
        {step === "intro" ? (
          <View style={{ gap: 14, marginTop: 44 }}>
            <Marquee chips={ROWS[0]} duration={26000} />
            <Marquee chips={ROWS[1]} duration={32000} reverse />
            <Marquee chips={ROWS[2]} duration={28000} />
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 36, paddingHorizontal: 24 }}>
            <TextInput testID="name-input" placeholder="Your name" placeholderTextColor={C.faint} value={name} onChangeText={setName} style={s.input} autoFocus />
            {step === "code" && (
              <TextInput testID="onboard-code-input" placeholder="Invite code" autoCapitalize="characters" placeholderTextColor={C.faint} value={code} onChangeText={setCode} style={s.input} />
            )}
          </View>
        )}
        </Animated2.View>

        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 6 }}>
          {step === "intro" ? (
            <>
              <Button testID="get-started" title="Get Started" onPress={() => setStep("name")} />
              <Pressable onPress={() => setStep("code")} style={{ height: 52, alignItems: "center", justifyContent: "center" }}>
                <Text style={s.link}>I Have an Invite Code</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Button testID="onboard-continue" title="Let's go" disabled={!name.trim() || (step === "code" && code.trim().length < 4)} loading={busy} onPress={finish} />
              <Pressable onPress={() => setStep("intro")} style={{ height: 52, alignItems: "center", justifyContent: "center" }}>
                <Text style={s.link}>Back</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
});
