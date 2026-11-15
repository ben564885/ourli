import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
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
      <Card onPress={() => setOpen(true)} style={{ minHeight: 84, alignItems: "center", justifyContent: "center" }}>
        <View testID="add-group" style={{ alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="add" size={34} color={C.text} />
        </View>
      </Card>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 22, paddingBottom: 36, gap: 14 }}>
            <View style={{ flexDirection: "row", backgroundColor: C.card, borderRadius: 999, padding: 4 }}>
              {(["create", "join"] as const).map((m) => (
                <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: mode === m ? C.accent : "transparent" }}>
                  <Text style={{ fontFamily: F.sansMedium, fontSize: 16, color: mode === m ? C.onAccent : C.muted }}>{m === "create" ? "New group" : "Invite code"}</Text>
                </Pressable>
              ))}
            </View>
            {mode === "create" ? (
              <>
                <TextInput testID="group-name-input" placeholder="Group name" placeholderTextColor={C.faint} value={groupName} onChangeText={setGroupName} style={styles.input} autoFocus />
                <Button
                  testID="create-group"
                  title="Create group"
                  disabled={!groupName.trim()}
                  onPress={async () => {
                    const id = await createGroup({ name: groupName, userId });
                    setGroupName("");
                    setOpen(false);
                    router.push(("/group/" + id) as any);
                  }}
                />
              </>
            ) : (
              <>
                <TextInput testID="invite-code-input" placeholder="Invite code" autoCapitalize="characters" placeholderTextColor={C.faint} value={code} onChangeText={setCode} style={styles.input} autoFocus />
                <Button
                  testID="join-group"
                  title="Join group"
                  disabled={code.trim().length < 4}
                  onPress={async () => {
                    try {
                      const id = await joinGroup({ inviteCode: code, userId });
                      setCode("");
                      setOpen(false);
                      router.push(("/group/" + id) as any);
                    } catch {
                      Alert.alert("Couldn't find that group", "Double-check the code and try again.");
                    }
                  }}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  input: { backgroundColor: C.bg, color: C.text, borderRadius: 999, height: 54, paddingHorizontal: 20, fontSize: 17, fontFamily: F.sans, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.line },
}));
