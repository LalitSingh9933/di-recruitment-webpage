import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeGalleryFile, storeGalleryFile, VIDEO_LIMIT } from "@/lib/gallery-storage";

export const runtime = "nodejs";

class UploadTooLarge extends Error {}

async function readUploadForm(request: Request) {
  if (!request.body) throw new Error("Choose a file.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  // Content-Length can be absent or forged, so enforce the limit while reading too.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > VIDEO_LIMIT + 1024 * 1024) {
      await reader.cancel();
      throw new UploadTooLarge("Videos must be under 15 MB and photos under 1 MB.");
    }
    chunks.push(value);
  }
  return new Response(new Uint8Array(Buffer.concat(chunks)), {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (
    !session ||
    !(await prisma.admin.findFirst({ where: { id: session.id, active: true } }))
  )
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  // Cookie authentication on this route also requires a same-origin browser request.
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > VIDEO_LIMIT + 1024 * 1024)
    return NextResponse.json(
      { error: "Videos must be under 15 MB and photos under 1 MB." },
      { status: 413 },
    );
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1)
    return NextResponse.json({ error: "Invalid album." }, { status: 400 });
  const album = await prisma.galleryAlbum.findUnique({ where: { id } });
  if (!album) return NextResponse.json({ error: "Album not found." }, { status: 404 });
  let stored;
  try {
    const form = await readUploadForm(request);
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "Choose a file." }, { status: 400 });
    stored = await storeGalleryFile(file);
    const highest = await prisma.galleryMedia.aggregate({
      where: { albumId: id },
      _max: { displayOrder: true },
    });
    const item = await prisma.galleryMedia.create({
      data: {
        ...stored,
        albumId: id,
        originalName: file.name.slice(0, 255),
        displayOrder: (highest._max.displayOrder ?? -1) + 1,
      },
    });
    revalidatePath("/gallery");
    revalidatePath("/gallery/" + album.slug);
    revalidatePath("/admin/gallery/" + id);
    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (error) {
    // Roll back the file if the database insert fails (for example, album deleted meanwhile).
    if (stored) await removeGalleryFile(stored.storageKey);
    if (error instanceof UploadTooLarge) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error && !stored
            ? error.message
            : "Upload failed. Please try again.",
      },
      { status: 400 },
    );
  }
}
