import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { identifyMedia } from "@/lib/gallery-storage";
import { IMAGE_LIMIT, PHOTO_LIMIT_MESSAGE } from "@/lib/upload-limits";

const root = path.resolve(
  process.env.TEAM_STORAGE_DIR || path.join(process.cwd(), "storage", "team"),
);
const routePrefix = "/api/team/photos/";

export function teamPhotoPath(key: string) {
  if (!/^[0-9a-f-]{36}\.webp$/.test(key)) throw new Error("Invalid photo.");
  return path.join(root, key);
}

export async function storeTeamPhoto(file: File) {
  if (!file.size || file.size >= IMAGE_LIMIT) throw new Error(PHOTO_LIMIT_MESSAGE);
  const input = Buffer.from(await file.arrayBuffer());
  if (!identifyMedia(input)?.mimeType.startsWith("image/"))
    throw new Error("Choose a JPG, PNG, or WebP photo.");
  let output: Buffer;
  try {
    // Decode and re-encode actual image pixels, strip metadata, and normalize orientation.
    output = await sharp(input, { limitInputPixels: 20_000_000, failOn: "error" })
      .rotate()
      .resize({ width: 800, height: 1000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error(
      "This photo could not be read. Choose a valid JPG, PNG, or WebP image.",
    );
  }
  if (output.length >= IMAGE_LIMIT) throw new Error(PHOTO_LIMIT_MESSAGE);
  const key = randomUUID() + ".webp";
  await mkdir(root, { recursive: true });
  await writeFile(teamPhotoPath(key), output, { flag: "wx" });
  return routePrefix + key;
}

export async function removeTeamPhoto(url: string | null) {
  // Never delete external URLs or paths outside the dedicated team storage folder.
  if (!url?.startsWith(routePrefix)) return;
  const key = url.slice(routePrefix.length);
  if (!/^[0-9a-f-]{36}\.webp$/.test(key)) return;
  try {
    await unlink(teamPhotoPath(key));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      console.error("Could not remove old team photo", key);
  }
}
