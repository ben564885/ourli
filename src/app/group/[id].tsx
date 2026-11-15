import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import QRCode from "react-native-qrcode-svg";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { Avatar, Body, Button, Card, H1, H2, Loading, Screen } from "@/components/ui";
import { StartDayForm } from "@/components/start-day-form";
import { scheduleDayPings } from "@/lib/notifications";
import { C } from "@/lib/theme";
import { useState } from "react";

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id as Id<"groups">;
  const { userId } = useSession();
  const group = useQuery(api.groups.get, { groupId });
  const start = useMutation(api.days.start);
  const seed = useAction(api.seed.seedGroup);
  const [seeding, setSeeding] = useState(false);

  if (group === undefined || !userId) return <Loading />;
  if (group === null) return <Screen><H1>Group not found</H1></Screen>;

  return (
    <Screen>
      <Button title="← Back" variant="ghost" style={{ alignSelf: "flex-start", height: 36, paddingHorizontal: 0 }} onPress={() => router.back()} />
      <H1>{group.name}</H1>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {group.members.map((m) => (
          <View key={m._id} style={{ alignItems: "center", gap: 4, width: 64 }}>
            <Avatar name={m.name} color={m.color} size={44} />
            <Text numberOfLines={1} style={{ color: C.muted, fontSize: 12 }}>{m.name}</Text>
          </View>
        ))}
      </View>

      {group.activeDay ? (
        <Card style={{ backgroundColor: C.accent }} onPress={() => router.push(("/day/" + group.activeDay!._id) as any)}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>A Day is live</Text>
          <Text style={{ color: "#fff" }}>Open it to snap this hour →</Text>
        </Card>
      ) : (
        <Card>
          <H2>Start a Day</H2>
          <StartDayForm
            onStart={async (v) => {
              const dayId = await start({ groupId, userId, ...v });
              await scheduleDayPings({ _id: dayId, startAt: v.startAt, slotMs: v.slotMinutes * 60000, hourCount: v.endHour - v.startHour, startHour: v.startHour, groupName: group.name });
              router.push(("/day/" + dayId) as any);
            }}
          />
        </Card>
      )}

      <Button testID="open-calendar" title="Group calendar" variant="secondary" onPress={() => router.push({ pathname: "/calendar", params: { groupId } } as any)} />

      <Card style={{ alignItems: "center" }}>
        <H2>Invite friends</H2>
        <Text selectable style={{ color: C.text, fontSize: 32, fontWeight: "800", letterSpacing: 6 }}>{group.inviteCode}</Text>
        <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: 16 }}>
          <QRCode value={"ourli://join/" + group.inviteCode} size={150} />
        </View>
        <Body muted>Scan or enter the code in ourli</Body>
      </Card>

      <Button
        title="Load demo history"
        variant="ghost"
        loading={seeding}
        onPress={async () => {
          setSeeding(true);
          try {
            const n = await seed({ groupId, userId });
            Alert.alert("Done", "Added " + n + " past Days to the calendar.");
          } finally {
            setSeeding(false);
          }
        }}
      />
    </Screen>
  );
}
