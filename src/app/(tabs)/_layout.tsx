import { Platform, Pressable, View } from "react-native";
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
      style={{ flex: 1, height: 64, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }, style]}>
        <Ionicons name="add" size={30} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function GlassTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { bottom } = insets;
  const glass = Platform.OS === "ios" && isLiquidGlassAvailable();
  const Wrap: any = glass ? GlassView : BlurView;
  const wrapProps = glass ? { glassEffectStyle: "regular" } : { intensity: 70, tint: "systemChromeMaterialLight" };
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: Math.max(bottom, 12) + 4, alignItems: "center" }}>
      <Wrap {...wrapProps} style={{ width: "86%", maxWidth: 380, height: 64, borderRadius: 32, overflow: "hidden", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, backgroundColor: glass ? undefined : "rgba(255,255,255,0.6)" }}>
        {state.routes.map((route, i) => {
          const { options } = descriptors[route.key];
          const focused = state.index === i;
          const press = () => {
            const e = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigateToTab(route.key);
          };
          if (route.name === "create") return <PlusButton key={route.key} onPress={press} />;
          return (
            <Pressable key={route.key} accessibilityLabel={options.title} testID={"tab-" + route.name} onPress={() => { Haptics.selectionAsync(); press(); }} style={{ flex: 1, height: 64, alignItems: "center", justifyContent: "center" }}>
              {options.tabBarIcon?.({ focused, color: focused ? C.text : "#6B6B75", size: 26 })}
            </Pressable>
          );
        })}
      </Wrap>
    </View>
  );
}

export default function TabsLayout() {
  const { userId } = useSession();
  return (
    <Tabs
      tabBar={(props) => (userId ? <GlassTabBar {...props} /> : null)}
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarShowLabel: false,
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: userId ? undefined : { display: "none" },
      }}>
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
