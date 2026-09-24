import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { galleryPath } from "@/lib/gallery-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response(null, { status: 404 });
  const item = await prisma.galleryMedia.findUnique({
    where: { id },
    include: { album: true },
  });
  if (!item) return new Response(null, { status: 404 });
  if (!item.album.published) {
    const session = await getSession();
    if (
      !session ||
      !(await prisma.admin.findFirst({ where: { id: session.id, active: true } }))
    )
      return new Response(null, { status: 404 });
  }
  const filename = galleryPath(item.storageKey);
  let file;
  try {
    file = await stat(filename);
  } catch {
    return new Response(null, { status: 404 });
  }
  const headers = new Headers({
    "Content-Type": item.mimeType,
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    // Do not cache publicly: unpublishing an album must hide its media immediately.
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
  });
  let start = 0;
  let end = file.size - 1;
  const range = request.headers.get("range");
  if (range) {
    // Native video controls request byte ranges for seeking and metadata playback.
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2]))
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": "bytes */" + file.size },
      });
    if (!match[1]) start = Math.max(0, file.size - Number(match[2]));
    else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(end, Number(match[2]));
    }
    if (
      start > end ||
      start >= file.size ||
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end)
    )
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": "bytes */" + file.size },
      });
    headers.set("Content-Range", "bytes " + start + "-" + end + "/" + file.size);
  }
  headers.set("Content-Length", String(end - start + 1));
  const stream = Readable.toWeb(
    createReadStream(filename, { start, end }),
  ) as ReadableStream<Uint8Array>;
  return new Response(stream, { status: range ? 206 : 200, headers });
}
