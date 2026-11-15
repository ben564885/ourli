import { useEffect } from "react";
import { router } from "expo-router";
import { Onboarding } from "@/components/onboarding";
import { useSession } from "@/lib/session";

export default function Welcome() {
  const { userId } = useSession();
  useEffect(() => {
    if (userId) router.replace("/");
  }, [userId]);
  return <Onboarding />;
}
