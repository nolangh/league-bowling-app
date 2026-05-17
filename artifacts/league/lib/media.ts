import { supabase } from "./supabase";

export type MediaKind = "image" | "video";

/**
 * Upload a local file URI (from expo-image-picker) to the `media` Supabase
 * Storage bucket and return its public URL.
 */
export async function uploadMedia(
  uri: string,
  kind: MediaKind,
  folder: string = "moments",
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? "anon";

  const ext = kind === "video" ? "mp4" : "jpg";
  const contentType = kind === "video" ? "video/mp4" : "image/jpeg";
  const fileName = `${folder}/${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, arrayBuffer, { contentType, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("media").getPublicUrl(fileName);
  return data.publicUrl;
}
