import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from "@expo-google-fonts/instrument-sans";
import { Newsreader_400Regular, Newsreader_400Regular_Italic } from "@expo-google-fonts/newsreader";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "@/lib/session";
import { C } from "@/lib/theme";
import "@/lib/notifications";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, { unsavedChangesWarning: false });

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, Newsreader_400Regular, Newsreader_400Regular_Italic });
  if (!fontsLoaded) return null;
  return (
    <ConvexProvider client={convex}>
      <SessionProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
            <Stack.Screen name="capture/[dayId]" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          </Stack>
        </SafeAreaProvider>
      </SessionProvider>
    </ConvexProvider>
  );
}
