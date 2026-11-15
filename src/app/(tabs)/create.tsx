import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { Body, Card, Chip, Display, Loading, Screen } from "@/components/ui";
import { GroupsPanel } from "@/components/groups-panel";
import { StartDayForm } from "@/components/start-day-form";
import { scheduleDayPings } from "@/lib/notifications";
import { C, F } from "@/lib/theme";

export default function Create() {
  const { userId } = useSession();
  const groups = useQuery(api.groups.mine, userId ? { userId } : "skip");
  const start = useMutation(api.days.start);
  const [picked, setPicked] = useState<Id<"groups">[] | null>(null);
  if (!userId || groups === undefined) return <Loading />;
  const selected = groups.filter((g) => (picked ?? groups.map((x) => x._id)).includes(g._id));
  const startable = selected.filter((g) => !g.activeDay);
  const group = selected[0];
  return (
    <Screen scroll={groups.length === 0} style={{ paddingBottom: 112 }}>
      <View style={{ marginTop: 8 }}>
        <Display lead="Start a" accent="Day" />
        <Text style={{ fontFamily: F.sansMedium, fontSize: 15, color: C.text, marginTop: 10 }}>Pick your groups and hours. Everyone snaps once an hour.</Text>
      </View>

      {groups.length > 0 && <View style={{ flex: 1 }} />}
      {groups.length === 0 ? (
        <GroupsPanel userId={userId} title="Start with a group" />
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {groups.map((g) => (
              <Chip
                key={g._id}
                label={g.name}
                selected={selected.some((s) => s._id === g._id)}
                onPress={() => {
                  const cur = picked ?? groups.map((x) => x._id);
                  setPicked(cur.includes(g._id) ? cur.filter((id) => id !== g._id) : [...cur, g._id]);
                }}
              />
            ))}
          </View>
          {startable.length === 0 && group?.activeDay ? (
            <Card style={{ backgroundColor: C.sky, borderColor: C.skyLine }} onPress={() => router.push(("/day/" + group.activeDay!._id) as any)}>
              <Text style={{ color: C.text, fontFamily: F.sansMedium, fontSize: 19 }}>A Day is already live</Text>
              <Text style={{ color: C.muted, fontFamily: F.serifItalic, fontSize: 17 }}>Open it to snap this hour →</Text>
            </Card>
          ) : (
            <Card>
              <StartDayForm
                onStart={async (v) => {
                  if (startable.length === 0) return;
                  let first: Id<"days"> | null = null;
                  for (const g of startable) {
                    const dayId = await start({ groupId: g._id, userId, ...v });
                    first ??= dayId;
                    await scheduleDayPings({ _id: dayId, startAt: v.startAt, slotMs: v.slotMinutes * 60000, hourCount: v.endHour - v.startHour, startHour: v.startHour, groupName: g.name });
                  }
                  router.push(("/day/" + first) as any);
                }}
              />
            </Card>
          )}
        </>
      )}

      <Card onPress={() => router.push("/creator/new")} style={{ backgroundColor: C.sky, borderColor: C.skyLine }}>
        <Text style={{ fontFamily: F.sansMedium, fontSize: 19, color: C.text }}>Creator Day</Text>
        <Body muted>Spend a day with your Whop members, hour by hour.</Body>
        <Text style={{ color: C.text, fontFamily: F.serifItalic, fontSize: 17 }}>Set one up →</Text>
      </Card>
    </Screen>
  );
}
