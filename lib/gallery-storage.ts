import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  IMAGE_LIMIT,
  VIDEO_LIMIT,
  PHOTO_LIMIT_MESSAGE,
  VIDEO_LIMIT_MESSAGE,
} from "@/lib/upload-limits";
export { IMAGE_LIMIT, VIDEO_LIMIT } from "@/lib/upload-limits";

// Keep uploads outside public/: draft media must pass authorization before serving.
// Production hosts need a persistent disk mounted at GALLERY_STORAGE_DIR.
const storageRoot = path.resolve(
  process.env.GALLERY_STORAGE_DIR || path.join(process.cwd(), "storage", "gallery"),
);

export function galleryPath(key: string) {
  // Only server-generated UUID filenames are accepted; never use the uploaded filename.
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm)$/.test(key))
    throw new Error("Invalid media key.");
  return path.join(storageRoot, key);
}

export function identifyMedia(
  bytes: Buffer,
): { mimeType: string; extension: string } | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { mimeType: "image/jpeg", extension: "jpg" };
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return { mimeType: "image/png", extension: "png" };
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return { mimeType: "image/webp", extension: "webp" };
  if (
    bytes.toString("ascii", 4, 8) === "ftyp" &&
    /^(isom|iso[2-9]|mp4[12]|avc1|M4V |MSNV|dash)$/.test(bytes.toString("ascii", 8, 12))
  )
    return { mimeType: "video/mp4", extension: "mp4" };
  if (
    bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) &&
    bytes.subarray(0, 4096).includes(Buffer.from("webm"))
  )
    return { mimeType: "video/webm", extension: "webm" };
  return null;
}

export async function storeGalleryFile(file: File) {
  if (!file.size) throw new Error("Choose a non-empty photo or video.");
  if (file.size >= VIDEO_LIMIT) throw new Error(VIDEO_LIMIT_MESSAGE);
  const bytes = Buffer.from(await file.arrayBuffer());
  // Inspect the bytes, not only the browser's filename or MIME declaration.
  const format = identifyMedia(bytes);
  if (!format) throw new Error("Use a JPG, PNG, WebP photo or an MP4/WebM video.");
  if (format.mimeType.startsWith("image/") && bytes.length >= IMAGE_LIMIT)
    throw new Error(PHOTO_LIMIT_MESSAGE);
  const storageKey = randomUUID() + "." + format.extension;
  await mkdir(storageRoot, { recursive: true });
  await writeFile(galleryPath(storageKey), bytes, { flag: "wx" });
  return { storageKey, mimeType: format.mimeType, size: bytes.length };
}

export async function removeGalleryFile(key: string) {
  try {
    await unlink(galleryPath(key));
  } catch (error) {
    // Already-missing files need no cleanup. Log other failures for the operator.
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      console.error("Gallery file cleanup failed:", key, error);
  }
}
