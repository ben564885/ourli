import { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { C, R } from "@/lib/theme";

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{ padding: 20, paddingBottom: 60, gap: 16 }, style]}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1, padding: 20, gap: 16 }, style]}>{children}</View>
      )}
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
    <Text style={{ fontSize: size, fontWeight: "800", color: C.text, letterSpacing: -1 }}>
      <Text style={{ color: C.accentSoft }}>our</Text>li
    </Text>
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
  const bg = variant === "primary" ? C.accent : variant === "whop" ? C.whop : variant === "secondary" ? C.cardHi : "transparent";
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnText, variant === "ghost" && { color: C.accentSoft }]}>{title}</Text>}
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

export function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#15151C", fontWeight: "800", fontSize: size * 0.42 }}>{name.slice(0, 1).toUpperCase()}</Text>
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
      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { color: C.text, fontSize: 34, fontWeight: "800", letterSpacing: -0.5 },
  h2: { color: C.text, fontSize: 20, fontWeight: "700" },
  body: { color: C.text, fontSize: 15, lineHeight: 21 },
  btn: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 10 },
});
