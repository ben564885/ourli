import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Id } from "@convex/_generated/dataModel";

const KEY = "ourli_user_id";

const memory: { value: string | null } = { value: null };

async function read() {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem(KEY) ?? null;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
  return Promise.race([SecureStore.getItemAsync(KEY).catch(() => memory.value), timeout]);
}

async function write(value: string | null) {
  if (Platform.OS === "web") {
    if (value) globalThis.localStorage?.setItem(KEY, value);
    else globalThis.localStorage?.removeItem(KEY);
    return;
  }
  memory.value = value;
  try {
    if (value) await SecureStore.setItemAsync(KEY, value);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {}
}

type Session = { userId: Id<"users"> | null; loading: boolean; setUserId: (id: Id<"users"> | null) => Promise<void> };
const Ctx = createContext<Session>({ userId: null, loading: true, setUserId: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setId] = useState<Id<"users"> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    read().then((v) => {
      setId(v as Id<"users"> | null);
      setLoading(false);
    });
  }, []);
  const setUserId = async (id: Id<"users"> | null) => {
    await write(id);
    setId(id);
  };
  return <Ctx.Provider value={{ userId, loading, setUserId }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
