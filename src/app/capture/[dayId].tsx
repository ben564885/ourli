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
import { Button, GroupBadge, Photo } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";

const useLiveCamera = Platform.OS !== "web" && Device.isDevice;

export default function Capture() {
  const { dayId, hourIndex } = useLocalSearchParams<{ dayId: string; hourIndex: string }>();
  const { userId } = useSession();
  const day = useQuery(api.days.get, { dayId: dayId as Id<"days"> });
  const genUrl = useMutation(api.captures.generateUploadUrl);
  const create = useMutation(api.captures.create);
  const groups = useQuery(api.groups.mine, userId ? { userId } : "skip");
  const [sheet, setSheet] = useState(false);
  const [chosen, setChosen] = useState<string[] | null>(null);
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

  const options = day?.type === "creator" ? [] : (groups ?? []).filter((g) => g.activeDay);
  const current = day?.groupId ? String(day.groupId) : null;
  const picked = chosen ?? (current ? [current] : []);

  async function send(targets: { dayId: Id<"days">; hourIndex: number }[]) {
    if (!preview || !userId || targets.length === 0) return;
    setBusy(true);
    try {
      const ids = await uploadPhoto(preview, () => genUrl());
      for (const t of targets) await create({ ...t, userId, ...ids });
      router.back();
    } finally {
      setBusy(false);
      setSheet(false);
    }
  }

  function post() {
    if (options.length <= 1) return send([{ dayId: dayId as Id<"days">, hourIndex: idx }]);
    setSheet(true);
  }

  function sendToPicked() {
    const targets: { dayId: Id<"days">; hourIndex: number }[] = [];
    for (const g of options) {
      if (!picked.includes(String(g._id)) || !g.activeDay) continue;
      if (g.activeDay._id === dayId) targets.push({ dayId: g.activeDay._id, hourIndex: idx });
      else {
        const clock = dayClock(g.activeDay, Date.now());
        if (!clock.notStarted && !clock.ended) targets.push({ dayId: g.activeDay._id, hourIndex: clock.current });
      }
    }
    return send(targets);
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
              <Button testID="post-photo" title={options.length > 1 ? "Send to…" : "Post"} loading={busy} onPress={post} style={{ width: 130 }} />
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
      {sheet && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(false)} />
          <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#16171A", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
            <View style={{ padding: 22, gap: 12 }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>Send to</Text>
              <Pressable
                testID="send-all"
                onPress={() => setChosen(picked.length === options.length ? [] : options.map((g) => String(g._id)))}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="people" size={20} color="#111" />
                </View>
                <Text style={{ flex: 1, color: "#fff", fontSize: 17, fontWeight: "600" }}>All groups</Text>
                <Ionicons name={picked.length === options.length ? "checkmark-circle" : "ellipse-outline"} size={26} color="#fff" />
              </Pressable>
              {options.map((g) => {
                const on = picked.includes(String(g._id));
                return (
                  <Pressable
                    key={g._id}
                    testID={"send-" + g.name}
                    onPress={() => setChosen(on ? picked.filter((x) => x !== String(g._id)) : [...picked, String(g._id)])}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
                    <GroupBadge color={g.color} icon={g.icon} size={40} />
                    <Text style={{ flex: 1, color: "#fff", fontSize: 17, fontWeight: "600" }}>{g.name}</Text>
                    <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={26} color={on ? "#fff" : "#6B6D73"} />
                  </Pressable>
                );
              })}
              <Pressable
                testID="send-confirm"
                disabled={picked.length === 0 || busy}
                onPress={sendToPicked}
                style={{ height: 56, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginTop: 6, opacity: picked.length === 0 ? 0.4 : 1 }}>
                <Text style={{ color: "#111", fontSize: 17, fontWeight: "700" }}>{picked.length === options.length ? "Send to all" : "Send to " + picked.length + (picked.length === 1 ? " group" : " groups")}</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      )}
      {busy && <ActivityIndicator style={{ position: "absolute", top: "50%", alignSelf: "center" }} color="#fff" size="large" />}
    </View>
  );
}
