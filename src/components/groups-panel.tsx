import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Body, Button, Card, H2, Pill, GroupBadge } from "./ui";
import { C, F, themed } from "@/lib/theme";

export function GroupsPanel({ userId, title = "Your groups" }: { userId: Id<"users">; title?: string }) {
  const groups = useQuery(api.groups.mine, { userId });
  const createGroup = useMutation(api.groups.create);
  const joinGroup = useMutation(api.groups.join);
  const [groupName, setGroupName] = useState("");
  const [code, setCode] = useState("");
  return (
    <View style={{ gap: 14 }}>
      <H2 style={{ marginTop: 14 }}>{title}</H2>
      {groups?.length === 0 && <Body muted>No groups yet. Make one for your friends, or join with a code.</Body>}
      {groups?.map((g) => (
        <Card key={g._id} onPress={() => router.push(("/group/" + g._id) as any)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <GroupBadge color={g.color} icon={g.icon} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: C.text, fontFamily: F.sansMedium, fontSize: 20 }}>{g.name}</Text>
              <Text style={{ color: C.muted, fontFamily: F.serif, fontSize: 16 }}>{g.memberCount} {g.memberCount === 1 ? "member" : "members"} · code {g.inviteCode}</Text>
            </View>
            {g.activeDay && <Pill text="Day live" color={C.accentSoft} />}
          </View>
        </Card>
      ))}
      <Card>
        <TextInput testID="group-name-input" placeholder="New group name" placeholderTextColor={C.faint} value={groupName} onChangeText={setGroupName} style={styles.input} />
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
        <TextInput testID="invite-code-input" placeholder="Invite code" autoCapitalize="characters" placeholderTextColor={C.faint} value={code} onChangeText={setCode} style={styles.input} />
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
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  input: { backgroundColor: C.bg, color: C.text, borderRadius: 999, height: 54, paddingHorizontal: 20, fontSize: 17, fontFamily: F.sans, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.line },
}));
