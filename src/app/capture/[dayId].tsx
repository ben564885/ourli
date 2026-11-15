import { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Device from "expo-device";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { uploadPhoto } from "@/lib/upload";
import { useNow } from "@/lib/use-now";
import { dayClock, formatCountdown } from "@/lib/time";
import { C } from "@/lib/theme";
import { Button, Photo } from "@/components/ui";

const useLiveCamera = Platform.OS !== "web" && Device.isDevice;

export default function Capture() {
  const { dayId, hourIndex } = useLocalSearchParams<{ dayId: string; hourIndex: string }>();
  const { userId } = useSession();
  const day = useQuery(api.days.get, { dayId: dayId as Id<"days"> });
  const genUrl = useMutation(api.captures.generateUploadUrl);
  const create = useMutation(api.captures.create);
  const [perm, requestPerm] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cam = useRef<CameraView>(null);
  const now = useNow();
  const idx = Number(hourIndex);

  const clock = day ? dayClock(day, now) : null;
  const status = day && clock ? "Hour " + (idx + 1) + " of " + day.hourCount + " · " + formatCountdown(clock.msLeft) + " left" : "";

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!res.canceled) setPreview(res.assets[0].uri);
  }

  async function post() {
    if (!preview || !userId) return;
    setBusy(true);
    try {
      const ids = await uploadPhoto(preview, () => genUrl());
      await create({ dayId: dayId as Id<"days">, userId, hourIndex: idx, ...ids });
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {preview ? (
        <Photo uri={preview} style={{ flex: 1, borderRadius: 0 }} />
      ) : useLiveCamera && perm?.granted ? (
        <CameraView ref={cam} style={{ flex: 1 }} facing={facing} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: "800", textAlign: "center" }}>What does your {status ? "hour" : "day"} look like?</Text>
          {useLiveCamera && !perm?.granted && <Button title="Allow camera" onPress={requestPerm} style={{ alignSelf: "stretch" }} />}
          <Button testID="pick-photo" title="Choose a photo" variant="secondary" onPress={pickFromLibrary} style={{ alignSelf: "stretch" }} />
        </View>
      )}

      <SafeAreaView style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable accessibilityLabel="Close camera" onPress={() => router.back()}>
            <Text style={{ color: "#fff", fontSize: 28 }}>×</Text>
          </Pressable>
          <View style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>{status}</Text>
          </View>
          <Pressable accessibilityLabel="Flip camera" onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}>
            <Text style={{ color: "#fff", fontSize: 22 }}>⟲</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingBottom: 24 }}>
          {preview ? (
            <>
              <Button title="Retake" variant="secondary" onPress={() => setPreview(null)} style={{ width: 130 }} />
              <Button testID="post-photo" title="Post" loading={busy} onPress={post} style={{ width: 130 }} />
            </>
          ) : useLiveCamera && perm?.granted ? (
            <>
              <Pressable accessibilityLabel="Library" onPress={pickFromLibrary} style={{ width: 60 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Library</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Take photo"
                onPress={async () => {
                  const pic = await cam.current?.takePictureAsync({ quality: 0.7 });
                  if (pic) setPreview(pic.uri);
                }}
                style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.25)" }}
              />
              <View style={{ width: 60 }} />
            </>
          ) : null}
        </View>
      </SafeAreaView>
      {busy && <ActivityIndicator style={{ position: "absolute", top: "50%", alignSelf: "center" }} color="#fff" size="large" />}
    </View>
  );
}
