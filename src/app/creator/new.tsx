import { useState } from "react";
import { Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { scheduleDayPings } from "@/lib/notifications";
import { C } from "@/lib/theme";
import { Body, Button, Card, H1, Loading, Pill, Screen } from "@/components/ui";
import { StartDayForm } from "@/components/start-day-form";

export default function NewCreatorDay() {
  const { userId } = useSession();
  const whop = useQuery(api.creator.whopConfigured);
  const start = useMutation(api.days.startCreator);
  const [title, setTitle] = useState("A Day with me");
  const [productId, setProductId] = useState("");
  if (!userId || whop === undefined) return <Loading />;
  const product = productId.trim() || whop.productId || "demo";
  return (
    <Screen>
      <Button title="← Back" variant="ghost" style={{ alignSelf: "flex-start", height: 36, paddingHorizontal: 0 }} onPress={() => router.back()} />
      <Pill text="Creator Day · powered by Whop" color={C.whop} />
      <H1>Spend the day with your fans</H1>
      <Body muted>Your Whop members join with one tap. Every hour they see your photo next to theirs, and tonight each fan gets a recap of their day with you.</Body>
      <Card>
        <Text style={{ color: C.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>TITLE</Text>
        <TextInput value={title} onChangeText={setTitle} style={{ backgroundColor: C.cardHi, color: C.text, borderRadius: 14, height: 50, paddingHorizontal: 16, fontSize: 16 }} />
        <Text style={{ color: C.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>WHOP PRODUCT</Text>
        <TextInput
          value={productId}
          onChangeText={setProductId}
          autoCapitalize="none"
          placeholder={whop.productId ?? "prod_…"}
          placeholderTextColor={C.faint}
          style={{ backgroundColor: C.cardHi, color: C.text, borderRadius: 14, height: 50, paddingHorizontal: 16, fontSize: 16 }}
        />
        {!whop.configured && <Body muted style={{ fontSize: 13 }}>Whop isn't connected on the backend yet, so fans join in demo mode.</Body>}
      </Card>
      <Card>
        <StartDayForm
          cta="Go live"
          variant="whop"
          onStart={async (v) => {
            const dayId = await start({ userId, title, whopProductId: product, ...v });
            await scheduleDayPings({ _id: dayId, startAt: v.startAt, slotMs: v.slotMinutes * 60000, hourCount: v.endHour - v.startHour, startHour: v.startHour, title });
            router.replace(("/day/" + dayId) as any);
          }}
        />
      </Card>
    </Screen>
  );
}
