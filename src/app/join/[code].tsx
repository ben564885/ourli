import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/session";
import { Loading } from "@/components/ui";

export default function JoinByLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { userId, loading } = useSession();
  const join = useMutation(api.groups.join);
  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.replace("/");
      return;
    }
    join({ inviteCode: code, userId })
      .then((id) => router.replace(("/group/" + id) as any))
      .catch(() => router.replace("/"));
  }, [loading, userId, code, join]);
  return <Loading />;
}
