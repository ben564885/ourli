import { Platform, Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSession } from "@/lib/session";
import { C } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const icon = (on: IconName, off: IconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return <Ionicons name={focused ? on : off} size={26} color={color as string} />;
  };

function PlusButton({ onPress }: { onPress?: (e: any) => void }) {
  const scale = useSharedValue(1);
  const spin = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }, { rotate: spin.get() + "deg" }] }));
  return (
    <Pressable
      accessibilityLabel="Create"
      testID="tab-create"
      onPressIn={() => {
        scale.set(withSpring(0.88, { damping: 12 }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        scale.set(withSequence(withSpring(1.18, { damping: 6 }), withSpring(1, { damping: 10 })));
        spin.set(withTiming(spin.get() + 90, { duration: 260 }));
        onPress?.(e);
      }}
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }, style]}>
        <Ionicons name="add" size={30} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

function GlassPill() {
  const glass = Platform.OS === "ios" && isLiquidGlassAvailable();
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: 36, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }]}>
      {glass ? (
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} />
      ) : (
        <BlurView intensity={70} tint="systemChromeMaterialLight" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 36, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(0,0,0,0.12)" }]} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { userId } = useSession();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarShowLabel: false,
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: userId
          ? { position: "absolute", left: 24, right: 24, bottom: 28, height: 72, borderRadius: 36, borderTopWidth: 0, backgroundColor: "transparent", elevation: 0, paddingTop: 0, paddingBottom: 0 }
          : { display: "none" },
        tabBarBackground: () => <GlassPill />,
        tabBarItemStyle: { height: 72, justifyContent: "center" },
      }}
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="groups" options={{ title: "Groups", tabBarIcon: icon("people", "people-outline") }} />
      <Tabs.Screen
        name="create"
        options={{ title: "Create", tabBarButton: (p) => <PlusButton onPress={p.onPress as any} /> }}
      />
      <Tabs.Screen
        name="creators"
        options={{ title: "Creators", tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "crown" : "crown-outline"} size={28} color={color as string} /> }}
      />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: icon("calendar", "calendar-outline") }} />
    </Tabs>
  );
}
