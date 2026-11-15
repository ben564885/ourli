import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { Avatar, Body, Button, Card, H2, Loading, Logo, Pill, Screen } from "@/components/ui";
import { Onboarding } from "@/components/onboarding";
import { C, F } from "@/lib/theme";
import { dayClock, formatCountdown, hourLabel } from "@/lib/time";
import { useNow } from "@/lib/use-now";

function ActiveBanner({ day }: { day: any }) {
  const now = useNow();
  const clock = dayClock(day, now);
  const label = day.type === "creator" ? (day.title ?? "Creator Day") : day.groupName;
  return (
    <Card style={{ backgroundColor: C.sky, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.skyLine }} onPress={() => router.push(("/day/" + day._id) as any)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: C.text, fontFamily: F.sansBold, fontSize: 19 }}>{label}</Text>
        {day.type === "creator" && <Pill text="Creator Day" color={C.whop} />}
      </View>
      <Text style={{ color: C.muted, fontFamily: F.sans }}>
        {clock.notStarted
          ? "Starts in " + formatCountdown(clock.msLeft)
          : hourLabel(day.startHour + clock.current) + " · hour " + (clock.current + 1) + " of " + day.hourCount + " · next in " + formatCountdown(clock.msLeft)}
      </Text>
      <Text style={{ color: C.text, fontFamily: F.serifItalic, fontSize: 17 }}>Open Day →</Text>
    </Card>
  );
}

export default function Home() {
  const { userId, loading, setUserId } = useSession();
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const groups = useQuery(api.groups.mine, userId ? { userId } : "skip");
  const active = useQuery(api.days.activeForUser, userId ? { userId } : "skip");
  const createGroup = useMutation(api.groups.create);
  const joinGroup = useMutation(api.groups.join);
  const [groupName, setGroupName] = useState("");
  const [code, setCode] = useState("");

  if (loading) return <Loading />;
  if (!userId || user === null) return <Onboarding />;
  if (user === undefined) return <Loading />;

  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <Pressable onLongPress={() => setUserId(null)} onPress={() => router.push("/calendar")}>
          <Avatar name={user.name} color={user.color} />
        </Pressable>
      </View>

      {active?.map((d) => <ActiveBanner key={d._id} day={d} />)}

      <H2>Your groups</H2>
      {groups?.length === 0 && <Body muted>No groups yet. Make one for your friends, or join with a code.</Body>}
      {groups?.map((g) => (
        <Card key={g._id} onPress={() => router.push(("/group/" + g._id) as any)}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "700" }}>{g.name}</Text>
            {g.activeDay && <Pill text="Day live" />}
          </View>
          <Body muted>{g.memberCount} {g.memberCount === 1 ? "member" : "members"} · code {g.inviteCode}</Body>
        </Card>
      ))}

      <Card>
        <TextInput
          testID="group-name-input"
          placeholder="New group name"
          placeholderTextColor={C.faint}
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
        />
        <Button
          testID="create-group"
          title="Create group"
          disabled={!groupName.trim()}
          onPress={async () => {
            const id = await createGroup({ name: groupName, userId });
            setGroupName("");
            router.push(("/group/" + id) as any);
          }}
        />
      </Card>
      <Card>
        <TextInput
          testID="invite-code-input"
          placeholder="Invite code"
          autoCapitalize="characters"
          placeholderTextColor={C.faint}
          value={code}
          onChangeText={setCode}
          style={styles.input}
        />
        <Button
          testID="join-group"
          variant="secondary"
          title="Join group"
          disabled={code.trim().length < 4}
          onPress={async () => {
            try {
              const id = await joinGroup({ inviteCode: code, userId });
              setCode("");
              router.push(("/group/" + id) as any);
            } catch {
              Alert.alert("Couldn't find that group", "Double-check the code and try again.");
            }
          }}
        />
      </Card>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button title="My calendar" variant="secondary" style={{ flex: 1 }} onPress={() => router.push("/calendar")} />
        <Button title="Creator Day" variant="whop" style={{ flex: 1 }} onPress={() => router.push("/creator/new")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: C.cardHi, color: C.text, borderRadius: 14, height: 50, paddingHorizontal: 16, fontSize: 16 },
});
