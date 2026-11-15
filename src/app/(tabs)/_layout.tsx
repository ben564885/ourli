import { Tabs } from "expo-router";
import { ColorValue, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const icon = (on: IconName, off: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? on : off} size={25} color={color as string} />;
  };

export default function TabsLayout() {
  const { userId } = useSession();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.faint,
        tabBarLabelStyle: { fontFamily: F.sansMedium, fontSize: 11 },
        tabBarStyle: userId ? { backgroundColor: C.bg, borderTopColor: "#ECECF0", height: 88, paddingTop: 8 } : { display: "none" },
      }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="groups" options={{ title: "Groups", tabBarIcon: icon("people", "people-outline") }} />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: () => (
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", marginTop: -14 }}>
              <Ionicons name="add" size={30} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: icon("calendar", "calendar-outline") }} />
    </Tabs>
  );
}
