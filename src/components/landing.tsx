import { useEffect, useState } from "react";
import { Animated, Easing, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { C } from "@/lib/theme";

const SERIF = "Newsreader_400Regular";
const SERIF_I = "Newsreader_400Regular_Italic";
const SANS = "InstrumentSans_400Regular";
const SANS_M = "InstrumentSans_500Medium";
const INK = "#16171A";
const REPO = "https://github.com/ben564885/ourli";
const pic = (seed: string, w = 240, h = 320) => "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;

function Bob({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -7, duration: 3500, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [y, delay]);
  return <Animated.View style={[style, { transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}

function Pill({ title, onPress, dark = true }: { title: string; onPress: () => void; dark?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.btn, dark ? { backgroundColor: "#1f1f1f" } : { backgroundColor: "#fff", borderWidth: 1, borderColor: "#1f1f1f" }]}>
      <Text style={{ fontFamily: SANS_M, fontSize: 16, color: dark ? "#fff" : "#151515" }}>{title}</Text>
    </Pressable>
  );
}

function PhoneMock() {
  const names = ["Ben", "Ayush", "Yelena"];
  const hours = ["12 PM", "1 PM", "2 PM", "3 PM"];
  return (
    <View style={s.phone}>
      <View style={s.phoneScreen}>
        <View style={s.island} />
        <View style={{ paddingTop: 54, paddingHorizontal: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: SANS_M, fontSize: 15, color: "#111" }}>Hackathon crew</Text>
            <Text style={{ fontFamily: SANS, fontSize: 11, color: "#8e8e93" }}>Hour 4 of 6 · 7:42 left</Text>
          </View>
          <View style={{ backgroundColor: "#ee4338", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: "#fff", fontSize: 11, fontFamily: SANS_M }}>● Live</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", paddingLeft: 44, paddingRight: 12, paddingTop: 12, gap: 6 }}>
          {names.map((n) => (
            <Text key={n} style={{ flex: 1, textAlign: "center", fontFamily: SANS_M, fontSize: 11, color: "#444" }}>{n}</Text>
          ))}
        </View>
        <View style={{ padding: 12, gap: 6 }}>
          {hours.map((h, r) => (
            <View key={h} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ width: 32, fontFamily: SANS_M, fontSize: 9, color: "#8e8e93" }}>{h}</Text>
              {names.map((n, c) =>
                r === 3 && c === 2 ? (
                  <View key={n} style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: 10, backgroundColor: "#eef0f4", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 10, color: "#9a9aa0", fontFamily: SANS_M }}>waiting…</Text>
                  </View>
                ) : (
                  <Image key={n} source={{ uri: pic("ourli-" + r + c) }} style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: 10 }} contentFit="cover" />
                ),
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Hero({ wide }: { wide: boolean }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 150, paddingHorizontal: 24, backgroundColor: "#fff", overflow: "hidden" }}>
      <Text style={[s.h1, { fontSize: wide ? 84 : 46, lineHeight: wide ? 88 : 50 }]}>
        Every hour,{"\n"}
        <Text style={{ fontFamily: SERIF_I, color: C.accentSoft }}>together.</Text>
      </Text>
      <Text style={[s.sub, { fontSize: wide ? 20 : 17 }]}>
        Start a Day with your friends. Everyone snaps a photo every hour, and tonight you get a side-by-side recap of how each day went, saved to a calendar you'll keep.
      </Text>
      <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 32 }}>
        <Pill title="Open ourli" onPress={() => router.push("/welcome")} />
        <Pill title="View on GitHub" dark={false} onPress={() => Linking.openURL(REPO)} />
      </View>
      <View style={{ width: "100%", maxWidth: 1100, height: wide ? 640 : 560, marginTop: 56, alignItems: "center" }}>
        <View style={{ position: "absolute", bottom: 0, width: wide ? 820 : 360, height: wide ? 420 : 300, borderTopLeftRadius: 420, borderTopRightRadius: 420, backgroundColor: "#fcf4c7", opacity: 0.8 }} />
        <View style={{ position: "absolute", top: 30 }}>
          <PhoneMock />
        </View>
        {wide && (
          <>
            <Bob style={{ position: "absolute", left: 40, top: 70 }} delay={200}>
              <View style={[s.float, { width: 214, height: 200, backgroundColor: "#b1c6dd", justifyContent: "space-between" }]}>
                <View style={s.tag}><View style={[s.dot, { backgroundColor: "#1f6fe0" }]} /><Text style={s.tagText}>Hour 4 of 6</Text></View>
                <View>
                  <Text style={{ fontFamily: SANS_M, fontSize: 15, color: "#14233a" }}>7:42 left to snap</Text>
                  <Text style={{ fontFamily: SANS, fontSize: 13, color: "#3c5372" }}>Photos stay hidden until you post yours.</Text>
                </View>
              </View>
            </Bob>
            <Bob style={{ position: "absolute", left: 150, top: 320 }} delay={900}>
              <View style={[s.float, { backgroundColor: "#f9bef9", paddingVertical: 14, paddingHorizontal: 22, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                <View style={[s.dot, { backgroundColor: "#2a0f2a" }]} />
                <Text style={{ fontFamily: SANS_M, fontSize: 15, color: "#2a0f2a" }}>everyone posted. reveal.</Text>
              </View>
            </Bob>
            <Bob style={{ position: "absolute", right: 40, top: 110 }} delay={500}>
              <View style={[s.float, { width: 250, height: 150, backgroundColor: "#ffdf6f", flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 22 }]}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 64 }}>
                  {[0.4, 1, 0.55, 0.8].map((h, i) => <View key={i} style={{ width: 15, height: 64 * h, borderRadius: 3, backgroundColor: "#391312" }} />)}
                </View>
                <View>
                  <Text style={{ fontFamily: SERIF, fontSize: 38, color: "#1d0b0a", lineHeight: 40 }}>18</Text>
                  <Text style={{ fontFamily: SANS, fontSize: 13, color: "#5a4a1a" }}>Days on the calendar</Text>
                </View>
              </View>
            </Bob>
            <Bob style={{ position: "absolute", right: 120, top: 330 }} delay={1300}>
              <View style={[s.float, { backgroundColor: "#b3f4b7", paddingVertical: 14, paddingHorizontal: 22, borderRadius: 999 }]}>
                <Text style={{ fontFamily: SANS_M, fontSize: 15, color: "#132815" }}>💬 "that sunset!!" · Maya</Text>
              </View>
            </Bob>
          </>
        )}
      </View>
    </View>
  );
}

const STEPS = [
  { n: "01", t: "Start a Day", d: "Pick your group and your hours, say 12 PM to 6 PM. Invite friends with a code or a QR.", bg: "#b1c6dd", fg: "#14233a", sub: "#3c5372" },
  { n: "02", t: "Snap every hour", d: "A ping on the hour. Take your photo anytime in that hour, no filters, no retakes spiral.", bg: "#ffdf6f", fg: "#1d0b0a", sub: "#5a4a1a" },
  { n: "03", t: "Reveal together", d: "Each hour stays hidden until you post yours. Then everyone's photos appear side by side, live.", bg: "#f9bef9", fg: "#2a0f2a", sub: "#6b3a6b" },
  { n: "04", t: "Keep the memory", d: "Tonight's recap is an hour-by-hour grid. Export it, share it, and find it on your calendar.", bg: "#b3f4b7", fg: "#132815", sub: "#2c4a30" },
];

function How({ wide }: { wide: boolean }) {
  return (
    <View id="how" style={{ paddingVertical: 100, paddingHorizontal: 24, alignItems: "center", backgroundColor: "#fff" }}>
      <View style={{ width: "100%", maxWidth: 1100 }}>
        <Text style={s.eyebrow}>HOW IT WORKS</Text>
        <Text style={[s.h2, { fontSize: wide ? 56 : 36, lineHeight: wide ? 60 : 40 }]}>
          Same hour, <Text style={{ fontFamily: SERIF_I, color: C.accentSoft }}>different lives.</Text>
        </Text>
        <View style={{ flexDirection: wide ? "row" : "column", gap: 14, marginTop: 48 }}>
          {STEPS.map((st) => (
            <View key={st.n} style={{ flex: 1, minHeight: 260, borderRadius: 24, padding: 22, backgroundColor: st.bg, justifyContent: "space-between" }}>
              <View style={s.tag}><Text style={s.tagText}>{st.n}</Text></View>
              <View>
                <Text style={{ fontFamily: SERIF, fontSize: 28, color: st.fg, letterSpacing: -0.5 }}>{st.t}</Text>
                <Text style={{ fontFamily: SANS, fontSize: 15, lineHeight: 21, color: st.sub, marginTop: 6 }}>{st.d}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Dark({ wide }: { wide: boolean }) {
  const items = [
    { n: "01", t: "Hidden until you post", d: "Nobody peeks. An hour only reveals once you've posted yours or the hour closes. Backed by a live Convex query, so it flips in real time." },
    { n: "02", t: "Comments on every photo", d: "Tap any revealed photo to open it full-size and react. Threads are gated by the same reveal rule, so nothing leaks early." },
    { n: "03", t: "A calendar of days", d: "Every Day becomes a darkened photo tile on your group's calendar. Scroll back through months of your own life together." },
    { n: "04", t: "One-tap collage", d: "Export the recap as one tall image and send it to Instagram or TikTok. It's the trend, minus the CapCut." },
  ];
  return (
    <View style={{ backgroundColor: "#0D0E11", paddingVertical: 100, paddingHorizontal: 24, alignItems: "center" }}>
      <View style={{ width: "100%", maxWidth: 1100 }}>
        <Text style={[s.eyebrow, { color: "#8b8d92" }]}>WHAT YOU GET</Text>
        <Text style={[s.h2, { color: "#fff", fontSize: wide ? 52 : 34, lineHeight: wide ? 56 : 38, maxWidth: 760 }]}>
          Built for the thing your group chat <Text style={{ fontFamily: SERIF_I, color: "#ffd9a8" }}>already does by hand.</Text>
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 48 }}>
          {items.map((it) => (
            <View key={it.n} style={{ flexBasis: wide ? "48.8%" : "100%", flexGrow: 1, backgroundColor: "#131419", borderColor: "#23252b", borderWidth: 1, borderRadius: 24, padding: 26 }}>
              <Text style={{ fontFamily: SANS_M, fontSize: 12, color: "#e2734f" }}>{it.n}</Text>
              <Text style={{ fontFamily: SERIF, fontSize: 28, color: "#fff", marginTop: 6, letterSpacing: -0.4 }}>{it.t}</Text>
              <Text style={{ fontFamily: SANS, fontSize: 15, lineHeight: 22, color: "#9a9ca3", marginTop: 8 }}>{it.d}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Creator({ wide }: { wide: boolean }) {
  return (
    <View id="creators" style={{ paddingVertical: 100, paddingHorizontal: 24, alignItems: "center", backgroundColor: "#fff" }}>
      <View style={{ width: "100%", maxWidth: 1100, borderRadius: 32, backgroundColor: "#f9bef9", padding: wide ? 56 : 28, flexDirection: wide ? "row" : "column", gap: 40, alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <View style={[s.tag, { marginBottom: 18 }]}><View style={[s.dot, { backgroundColor: C.whop }]} /><Text style={s.tagText}>Creator Days · powered by Whop</Text></View>
          <Text style={[s.h2, { color: "#2a0f2a", fontSize: wide ? 48 : 34, lineHeight: wide ? 52 : 38 }]}>
            Spend the day with your <Text style={{ fontFamily: SERIF_I }}>favorite creator.</Text>
          </Text>
          <Text style={{ fontFamily: SANS, fontSize: 17, lineHeight: 25, color: "#6b3a6b", marginTop: 16 }}>
            Your Whop membership is the ticket in. Sign in with Whop, we check you hold the creator's pass, and every hour you see their photo right next to yours. Tonight you get a recap of your day with them.
          </Text>
          <View style={{ marginTop: 26, flexDirection: "row" }}>
            <Pill title="Try a Creator Day" onPress={() => router.push("/welcome")} />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {[["creator", "Maya"], ["you", "You"]].map(([k, label], i) => (
            <View key={k} style={{ alignItems: "center", gap: 8 }}>
              <Image source={{ uri: pic("creator-" + k, 300, 400) }} style={{ width: wide ? 150 : 130, aspectRatio: 3 / 4, borderRadius: 18 }} contentFit="cover" />
              <Text style={{ fontFamily: SANS_M, fontSize: 13, color: "#2a0f2a" }}>{label} · {i === 0 ? "3:02 PM" : "3:09 PM"}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Built({ wide }: { wide: boolean }) {
  const stack = [
    ["Capy", "Built the whole app"],
    ["Convex", "Realtime backend, storage, scheduling"],
    ["Revyl", "Cloud iOS builds and device tests"],
    ["Whop", "Creator Day access"],
  ];
  return (
    <View id="stack" style={{ paddingBottom: 100, paddingHorizontal: 24, alignItems: "center", backgroundColor: "#fff" }}>
      <View style={{ width: "100%", maxWidth: 1100 }}>
        <Text style={s.eyebrow}>BUILT AT THE CONSUMER MOBILE HACKATHON</Text>
        <View style={{ flexDirection: wide ? "row" : "column", gap: 14, marginTop: 8 }}>
          {stack.map(([n, d]) => (
            <View key={n} style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderColor: "#e6e3db", padding: 22 }}>
              <Text style={{ fontFamily: SERIF, fontSize: 30, color: INK }}>{n}</Text>
              <Text style={{ fontFamily: SANS, fontSize: 14, color: "#6b6d73", marginTop: 4 }}>{d}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function Landing() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView>
        <Hero wide={wide} />
        <How wide={wide} />
        <Dark wide={wide} />
        <Creator wide={wide} />
        <Built wide={wide} />
        <View style={{ paddingVertical: 36, alignItems: "center", borderTopWidth: 1, borderTopColor: "#e6e3db" }}>
          <Text style={{ fontFamily: SANS, fontSize: 13, color: "#8b8d92" }}>ourli · every hour, together</Text>
        </View>
      </ScrollView>
      <View style={s.header}>
        <Text style={{ fontFamily: SANS_M, fontSize: 24, letterSpacing: -0.8, color: "#111" }}>
          <Text style={{ fontFamily: SERIF_I }}>our</Text>li
        </Text>
        {wide && (
          <View style={{ position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 40, pointerEvents: "none" }}>
            {["How it works", "Creator Days", "Stack"].map((l) => (
              <Text key={l} style={{ fontFamily: SANS, fontSize: 16, color: "#1a1a1a" }}>{l}</Text>
            ))}
          </View>
        )}
        <Pressable onPress={() => router.push("/welcome")} style={[s.btn, { backgroundColor: "#0b0b0b", height: 46, paddingHorizontal: 22 }]}>
          <Text style={{ fontFamily: SANS_M, fontSize: 15, color: "#fff" }}>Open ourli</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { position: "absolute", top: 0, left: 0, right: 0, height: 76, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.92)" },
  h1: { fontFamily: SERIF, color: "#151515", textAlign: "center", letterSpacing: -2 },
  h2: { fontFamily: SERIF, color: "#151515", letterSpacing: -1.2 },
  sub: { fontFamily: SANS, color: "#2b2b2b", textAlign: "center", maxWidth: 600, marginTop: 24, lineHeight: 28 },
  eyebrow: { fontFamily: SANS_M, fontSize: 12, letterSpacing: 1.4, color: "#8b8d92", marginBottom: 16 },
  btn: { height: 58, paddingHorizontal: 30, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  phone: { width: 300, height: 600, borderRadius: 50, backgroundColor: "#1a1a1a", padding: 8 },
  phoneScreen: { flex: 1, borderRadius: 42, backgroundColor: "#fff", overflow: "hidden" },
  island: { position: "absolute", top: 12, alignSelf: "center", width: 90, height: 26, borderRadius: 20, backgroundColor: "#000", zIndex: 3 },
  float: { borderRadius: 22, padding: 16 },
  tag: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontFamily: SANS_M, fontSize: 12, color: "#111" },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
