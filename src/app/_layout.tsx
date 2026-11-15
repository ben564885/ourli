import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "@/lib/session";
import { C } from "@/lib/theme";
import "@/lib/notifications";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, { unsavedChangesWarning: false });

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <SessionProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
            <Stack.Screen name="capture/[dayId]" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          </Stack>
        </SafeAreaProvider>
      </SessionProvider>
    </ConvexProvider>
  );
}
