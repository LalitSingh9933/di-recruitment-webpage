import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { identifyMedia } from "@/lib/gallery-storage";
import { IMAGE_LIMIT, PHOTO_LIMIT_MESSAGE } from "@/lib/upload-limits";

const root = path.resolve(process.env.CONTENT_IMAGE_STORAGE_DIR || "storage/content");
export const contentImagePrefix = "/api/content/images/";
export function contentImagePath(key: string) {
  if (!/^[0-9a-f-]{36}\.webp$/.test(key)) throw new Error("Invalid image.");
  return path.join(root, key);
}
export class ImageUploadError extends Error {}

export async function uploadContentImage(form: FormData) {
  const file = form.get("image");
  if (!(file instanceof File) || !file.size) return null;
  if (file.size >= IMAGE_LIMIT) throw new ImageUploadError(PHOTO_LIMIT_MESSAGE);
  const input = Buffer.from(await file.arrayBuffer());
  if (!identifyMedia(input)?.mimeType.startsWith("image/"))
    throw new ImageUploadError("Choose a JPG, PNG, or WebP image.");
  let output: Buffer;
  try {
    // Decode actual pixels and strip metadata; never trust the filename or MIME type.
    output = await sharp(input, { limitInputPixels: 20_000_000, failOn: "error" })
      .rotate()
      .resize({ width: 2000, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new ImageUploadError(
      "This image could not be read. Choose a valid JPG, PNG, or WebP image.",
    );
  }
  if (output.length >= IMAGE_LIMIT) throw new ImageUploadError(PHOTO_LIMIT_MESSAGE);
  const key = randomUUID() + ".webp";
  await mkdir(root, { recursive: true });
  await writeFile(contentImagePath(key), output, { flag: "wx" });
  return contentImagePrefix + key;
}

export async function removeContentImage(url: string | null | undefined) {
  // Existing external document links are preserved; only owned uploads are deleted.
  if (!url?.startsWith(contentImagePrefix)) return;
  const key = url.slice(contentImagePrefix.length);
  if (!/^[0-9a-f-]{36}\.webp$/.test(key)) return;
  try {
    await unlink(contentImagePath(key));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      console.error("Unable to remove content image", key);
  }
}
