import { Pressable } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
      style={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}>
      <Animated.View style={[{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", marginTop: -18, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, style]}>
        <Ionicons name="add" size={34} color="#fff" />
      </Animated.View>
    </Pressable>
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
        tabBarStyle: userId ? { backgroundColor: C.bg, borderTopColor: "#ECECF0", height: 84, paddingTop: 10 } : { display: "none" },
      }}
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen
        name="create"
        options={{ title: "Create", tabBarButton: (p) => <PlusButton onPress={p.onPress as any} /> }}
      />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: icon("calendar", "calendar-outline") }} />
    </Tabs>
  );
}
