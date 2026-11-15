import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Id } from "@convex/_generated/dataModel";

async function put(uploadUrl: string, uri: string) {
  const blob = await (await fetch(uri)).blob();
  const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: blob });
  if (!res.ok) throw new Error("Upload failed");
  const { storageId } = await res.json();
  return storageId as Id<"_storage">;
}

export async function uploadPhoto(uri: string, getUrl: () => Promise<string>) {
  const full = await manipulateAsync(uri, [{ resize: { width: 1080 } }], { compress: 0.7, format: SaveFormat.JPEG });
  const thumb = await manipulateAsync(uri, [{ resize: { width: 240 } }], { compress: 0.6, format: SaveFormat.JPEG });
  const [storageId, thumbId] = await Promise.all([put(await getUrl(), full.uri), put(await getUrl(), thumb.uri)]);
  return { storageId, thumbId };
}

export async function uploadAvatar(uri: string, getUrl: () => Promise<string>) {
  const img = await manipulateAsync(uri, [{ resize: { width: 480 } }], { compress: 0.75, format: SaveFormat.JPEG });
  return await put(await getUrl(), img.uri);
}
