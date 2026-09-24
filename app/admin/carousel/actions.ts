"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadContentImage,
  removeContentImage,
  ImageUploadError,
} from "@/lib/content-image-storage";

type Result = { error?: string; success?: string };
export async function saveSlide(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({
      title: z.string().trim().min(3).max(180),
      displayOrder: z.coerce.number().int().min(0).max(9999),
      published: z.boolean(),
    })
    .safeParse({
      ...Object.fromEntries(form),
      published: form.get("published") === "on",
    });
  if (!parsed.success)
    return { error: "Enter a title (3–180 characters) and display order (0–9999)." };
  const id = form.get("id") ? Number(form.get("id")) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id < 1))
    return { error: "Invalid slide." };
  let uploaded: string | null = null;
  try {
    const old = id ? await prisma.carouselSlide.findUnique({ where: { id } }) : null;
    if (id && !old) return { error: "This slide no longer exists." };
    uploaded = await uploadContentImage(form);
    const imageUrl = uploaded || old?.imageUrl;
    if (!imageUrl) throw new ImageUploadError("Please upload a carousel image.");
    if (old) {
      const updated = await prisma.carouselSlide.updateMany({
        where: { id, updatedAt: old.updatedAt },
        data: { ...parsed.data, imageUrl },
      });
      if (!updated.count)
        throw new ImageUploadError("This slide changed. Reload and try again.");
      if (old.imageUrl !== imageUrl) await removeContentImage(old.imageUrl);
    } else await prisma.carouselSlide.create({ data: { ...parsed.data, imageUrl } });
  } catch (error) {
    await removeContentImage(uploaded);
    return {
      error:
        error instanceof ImageUploadError ? error.message : "Unable to save the slide.",
    };
  }
  revalidatePath("/");
  revalidatePath("/admin/carousel");
  return {
    success: parsed.data.published
      ? "Slide published. Refresh the homepage to see it."
      : "Slide saved as a draft. It is hidden from the homepage.",
  };
}
export async function deleteSlide(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid slide." };
  try {
    const slide = await prisma.carouselSlide.delete({ where: { id } });
    await removeContentImage(slide.imageUrl);
  } catch {
    return { error: "Unable to delete the slide." };
  }
  revalidatePath("/");
  revalidatePath("/admin/carousel");
  return { success: "Slide deleted." };
}
