import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { C } from "@/lib/theme";
import { hourLabel, localDate } from "@/lib/time";
import { Body, Button } from "./ui";

export type StartDayValues = { date: string; startHour: number; endHour: number; startAt: number; slotMinutes: number };

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={{ color: C.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.bg, borderRadius: 999, height: 54, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.line }}>
        <Pressable accessibilityLabel={label + " earlier"} onPress={() => onChange(Math.max(min, value - 1))} style={{ paddingHorizontal: 18, height: 54, justifyContent: "center" }}>
          <Text style={{ color: C.text, fontSize: 20 }}>−</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: "center", color: C.text, fontSize: 16, fontWeight: "700" }}>{hourLabel(value)}</Text>
        <Pressable accessibilityLabel={label + " later"} onPress={() => onChange(Math.min(max, value + 1))} style={{ paddingHorizontal: 18, height: 54, justifyContent: "center" }}>
          <Text style={{ color: C.text, fontSize: 20 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function StartDayForm({ onStart, cta = "Start Day", variant = "primary" }: { onStart: (v: StartDayValues) => Promise<void>; cta?: string; variant?: "primary" | "whop" }) {
  const nowHour = new Date().getHours();
  const [startHour, setStart] = useState(nowHour);
  const [endHour, setEnd] = useState(Math.min(24, nowHour + 6));
  const [fast, setFast] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Stepper label="FROM" value={startHour} min={0} max={23} onChange={(n) => { setStart(n); if (endHour <= n) setEnd(n + 1); }} />
        <Stepper label="TO" value={endHour} min={startHour + 1} max={24} onChange={setEnd} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Body>Fast mode</Body>
          <Body muted style={{ fontSize: 13 }}>Each hour lasts 1 minute, for demos.</Body>
        </View>
        <Switch testID="fast-mode" value={fast} onValueChange={setFast} trackColor={{ true: C.accent }} />
      </View>
      <Button
        testID="start-day"
        variant={variant}
        title={cta + " · " + (endHour - startHour) + (endHour - startHour === 1 ? " hour" : " hours")}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          const d = new Date();
          let startAt: number;
          if (fast) {
            startAt = Date.now();
          } else {
            const s = new Date(d);
            s.setHours(startHour, 0, 0, 0);
            startAt = s.getTime();
          }
          try {
            await onStart({ date: localDate(d), startHour, endHour, startAt, slotMinutes: fast ? 1 : 60 });
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
