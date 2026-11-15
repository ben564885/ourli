import { View } from "react-native";
import { useSession } from "@/lib/session";
import { Display, Loading, Screen } from "@/components/ui";
import { GroupsPanel } from "@/components/groups-panel";

export default function Groups() {
  const { userId } = useSession();
  if (!userId) return <Loading />;
  return (
    <Screen>
      <View style={{ marginTop: 8 }}>
        <Display lead="Your" accent="people" />
      </View>
      <GroupsPanel userId={userId} title="Groups" />
    </Screen>
  );
}
