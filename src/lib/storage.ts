import { supabase } from "./supabase";

/**
 * Image uploads for WalkBuddy.
 *
 * Files go to Supabase Storage and we keep only the public URL in the row —
 * base64 data URLs were previously stuffed into localStorage, which blows the
 * ~5 MB quota after a handful of photos.
 *
 * Buckets (create them once — see supabase/storage.sql):
 *   trail-images  public  — route/path photos on the feed
 *   avatars       public  — user profile pictures
 */

export type Bucket = "trail-images" | "avatars";

/** Anything larger is rejected before we spend bandwidth on it. */
const MAX_BYTES = 5 * 1024 * 1024;

export interface UploadResult {
  url: string;
  /** True when the upload failed and we fell back to an inline data URL. */
  fallback: boolean;
  error?: string;
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const fromType = file.type.split("/")[1];
  return fromType || "jpg";
}

/** Reads a file as a base64 data URL (used only as an offline fallback). */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image and returns its public URL.
 *
 * If Supabase is unreachable or the bucket is missing, this falls back to an
 * inline data URL so the user never loses their pick — `fallback` says which
 * path was taken so the caller can warn.
 */
export async function uploadImage(
  file: File,
  bucket: Bucket,
  userId?: string
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is larger than 5 MB. Please pick a smaller one.");
  }

  const path = `${userId || "anon"}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extensionFor(file)}`;

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Could not resolve the public URL.");
    return { url: data.publicUrl, fallback: false };
  } catch (err: any) {
    // Keep the app usable offline / before the bucket exists.
    console.warn(`[WalkBuddy] Storage upload failed (${bucket}):`, err?.message || err);
    return {
      url: await readAsDataUrl(file),
      fallback: true,
      error: err?.message || "Upload failed",
    };
  }
}
