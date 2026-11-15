import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, Easing, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from "@expo-google-fonts/instrument-sans";
import { Newsreader_400Regular, Newsreader_400Regular_Italic } from "@expo-google-fonts/newsreader";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "@/lib/session";
import { C, Mode, modeBg, setTheme, ThemeContext } from "@/lib/theme";
import "@/lib/notifications";

const THEME_KEY = "ourli_theme";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, { unsavedChangesWarning: false });

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, Newsreader_400Regular, Newsreader_400Regular_Italic });
  const [mode, setMode] = useState<Mode>("dark");
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => {
    const apply = (v: string | null) => {
      const m: Mode = v === "light" ? "light" : "dark";
      setTheme(m);
      setMode(m);
      setThemeReady(true);
    };
    if (Platform.OS === "web") return apply(globalThis.localStorage?.getItem(THEME_KEY) ?? null);
    SecureStore.getItemAsync(THEME_KEY).then(apply, () => apply(null));
  }, []);
  const [fade] = useState(() => new Animated.Value(0));
  const [veil, setVeil] = useState<Mode>("dark");
  const [switching, setSwitching] = useState(false);
  const toggle = useCallback(() => {
    if (switching) return;
    const next: Mode = mode === "dark" ? "light" : "dark";
    setSwitching(true);
    setVeil(next);
    Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setTheme(next);
      setMode(next);
      if (Platform.OS === "web") globalThis.localStorage?.setItem(THEME_KEY, next);
      else SecureStore.setItemAsync(THEME_KEY, next).catch(() => {});
      setTimeout(() => {
        Animated.timing(fade, { toValue: 0, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(() => setSwitching(false));
      }, 80);
    });
  }, [mode, switching, fade]);
  const theme = useMemo(() => ({ mode, toggle }), [mode, toggle]);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const url = res.notification.request.content.data?.url;
      if (typeof url === "string") router.push(url.replace("ourli://", "/") as any);
    });
    return () => sub.remove();
  }, []);
  if (!fontsLoaded || !themeReady) return null;
  return (
    <ConvexProvider client={convex}>
      <SessionProvider>
        <ThemeContext.Provider value={theme}>
        <SafeAreaProvider key={mode}>
          <StatusBar style={mode === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: "slide_from_right", animationDuration: 300, gestureEnabled: true }}>
            <Stack.Screen name="(tabs)" options={{ animation: "fade", animationDuration: 250 }} />
            <Stack.Screen name="welcome" options={{ animation: "fade_from_bottom" }} />
            <Stack.Screen name="photo/[captureId]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="c/[code]" options={{ animation: "fade_from_bottom" }} />
            <Stack.Screen name="capture/[dayId]" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
          </Stack>
        </SafeAreaProvider>
        <Animated.View pointerEvents={switching ? "auto" : "none"} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: modeBg[veil], opacity: fade }} />
        </ThemeContext.Provider>
      </SessionProvider>
    </ConvexProvider>
  );
}
