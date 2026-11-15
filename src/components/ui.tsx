import { ReactNode } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { C, F, R } from "@/lib/theme";

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
      <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{ padding: 20, paddingBottom: 130, gap: 16 }, style]}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1, padding: 20, gap: 16 }, style]}>{children}</View>
      )}
      </Animated.View>
    </SafeAreaView>
  );
}

export function H1({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[s.h1, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[s.h2, style]}>{children}</Text>;
}

export function Body({ children, style, muted }: { children: ReactNode; style?: TextStyle; muted?: boolean }) {
  return <Text style={[s.body, muted && { color: C.muted }, style]}>{children}</Text>;
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontFamily: F.sansBold, color: C.text, letterSpacing: -size * 0.04 }}>ourli</Text>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  testID,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "whop";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}) {
  const bg = variant === "primary" || variant === "whop" ? C.accent : variant === "secondary" ? C.sky : "transparent";
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style]}>
      {loading ? <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? C.text : "#fff"} /> : <Text style={[s.btnText, (variant === "ghost" || variant === "secondary") && { color: C.text }]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }, style]}>
        {children}
      </Pressable>
    );
  return <View style={[s.card, style]}>{children}</View>;
}

export function Avatar({ name, color, size = 36, avatarUrl }: { name: string; color: string; size?: number; avatarUrl?: string | null }) {
  if (avatarUrl) return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} contentFit="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#111", fontFamily: F.sansBold, fontSize: size * 0.42 }}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function Photo({ uri, style, blur }: { uri: string | null; style?: ViewStyle; blur?: boolean }) {
  if (!uri) return <View style={[{ backgroundColor: C.cardHi, borderRadius: R.tile }, style]} />;
  return <Image source={{ uri }} style={[{ borderRadius: R.tile }, style as object]} contentFit="cover" blurRadius={blur ? 40 : 0} transition={150} />;
}

export function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={C.accentSoft} />
    </View>
  );
}

export function Pill({ text, color = C.accent }: { text: string; color?: string }) {
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: color, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: "#fff", fontSize: 12, fontFamily: F.sansBold }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { color: C.text, fontSize: 40, lineHeight: 44, fontFamily: F.sansMedium, letterSpacing: -1.5 },
  h2: { color: C.text, fontSize: 22, fontFamily: F.sansMedium, letterSpacing: -0.5 },
  body: { color: C.text, fontSize: 15, lineHeight: 21, fontFamily: F.sans },
  btn: { height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  btnText: { color: "#fff", fontSize: 17, fontFamily: F.sansMedium },
  card: { backgroundColor: C.bg, borderRadius: 28, padding: 18, gap: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.line },
});

export function Display({ lead, accent, tail, size = 40 }: { lead?: string; accent: string; tail?: string; size?: number }) {
  return (
    <Text style={{ color: C.text, fontSize: size, lineHeight: size * 1.08, fontFamily: F.sansMedium, letterSpacing: -size * 0.035 }}>
      {lead ? lead + " " : ""}
      <Text style={{ fontFamily: F.serifItalic, fontSize: size * 1.04 }}>{accent}</Text>
      {tail ? " " + tail : ""}
    </Text>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ height: 46, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1.5, borderStyle: "dashed", borderColor: selected ? C.skyLine : C.line, backgroundColor: selected ? C.sky : C.bg, justifyContent: "center" }}>
      <Text style={{ fontFamily: F.serif, fontSize: 17, color: C.text }}>{label}</Text>
    </Pressable>
  );
}
