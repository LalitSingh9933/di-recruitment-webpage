"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { removeGalleryFile } from "@/lib/gallery-storage";

export type GalleryResult = { error?: string; success?: string };
const albumSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  description: z.string().trim().max(3000),
  eventDate: z
    .string()
    .refine(
      (value) =>
        !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))),
      "Enter a valid date.",
    ),
  displayOrder: z.coerce.number().int().min(0).max(9999),
  published: z.boolean(),
});

// Invalidate both the folder listing and detail page after any album/media mutation.
function refreshGallery(slug: string, id: number) {
  revalidatePath("/gallery");
  revalidatePath("/gallery/" + slug);
  revalidatePath("/admin/gallery");
  revalidatePath("/admin/gallery/" + id);
}

export async function saveAlbum(
  _: GalleryResult,
  form: FormData,
): Promise<GalleryResult> {
  await requireAdmin();
  const parsed = albumSchema.safeParse({
    ...Object.fromEntries(form),
    published: form.get("published") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues
        .map((issue) => issue.path.join(".") + ": " + issue.message)
        .join(" "),
    };
  const id = form.get("id") ? Number(form.get("id")) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id < 1))
    return { error: "Invalid album." };
  let saved;
  try {
    const data = {
      ...parsed.data,
      eventDate: parsed.data.eventDate
        ? new Date(parsed.data.eventDate + "T00:00:00Z")
        : null,
    };
    if (id) {
      const previous = await prisma.galleryAlbum.findUnique({ where: { id } });
      if (!previous) return { error: "Album not found." };
      saved = await prisma.galleryAlbum.update({ where: { id }, data });
      revalidatePath("/gallery/" + previous.slug);
    } else {
      saved = await prisma.galleryAlbum.create({ data });
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return { error: "That album URL is already used." };
    return { error: "Unable to save the album." };
  }
  refreshGallery(saved.slug, saved.id);
  redirect("/admin/gallery/" + saved.id);
}

export async function deleteAlbum(
  _: GalleryResult,
  form: FormData,
): Promise<GalleryResult> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid album." };
  try {
    // Delete metadata first so the removed album is immediately inaccessible.
    const album = await prisma.galleryAlbum.delete({
      where: { id },
      include: { media: true },
    });
    await Promise.all(album.media.map((item) => removeGalleryFile(item.storageKey)));
    refreshGallery(album.slug, id);
  } catch {
    return { error: "Unable to delete this album." };
  }
  redirect("/admin/gallery");
}

export async function saveMedia(
  _: GalleryResult,
  form: FormData,
): Promise<GalleryResult> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.coerce.number().int().positive(),
      caption: z.string().trim().max(500),
      displayOrder: z.coerce.number().int().min(0).max(9999),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check the caption and display order." };
  try {
    const { id, ...data } = parsed.data;
    const item = await prisma.galleryMedia.update({
      where: { id },
      data,
      include: { album: true },
    });
    refreshGallery(item.album.slug, item.albumId);
  } catch {
    return { error: "Unable to update media." };
  }
  return { success: "Saved." };
}

export async function deleteMedia(
  _: GalleryResult,
  form: FormData,
): Promise<GalleryResult> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid media." };
  try {
    const item = await prisma.galleryMedia.delete({
      where: { id },
      include: { album: true },
    });
    await removeGalleryFile(item.storageKey);
    refreshGallery(item.album.slug, item.albumId);
  } catch {
    return { error: "Unable to delete this file." };
  }
  return {};
}
