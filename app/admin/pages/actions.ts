"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isContentSlug } from "@/lib/content-pages";
import {
  uploadContentImage,
  removeContentImage,
  ImageUploadError,
} from "@/lib/content-image-storage";
export type ContentResult = { error?: string; success?: string };
export async function saveContent(
  _: ContentResult,
  form: FormData,
): Promise<ContentResult> {
  await requireAdmin();
  const slug = String(form.get("slug"));
  if (!isContentSlug(slug)) return { error: "Unknown page." };
  const parsed = z
    .object({
      title: z.string().trim().min(3).max(180),
      content: z.string().trim().min(20).max(100000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Enter a title (3–180 characters) and page content (20–100,000 characters).",
    };
  let uploaded: string | null = null;
  try {
    const old = await prisma.contentPage.findUnique({ where: { slug } });
    const leadership =
      slug === "chairman-message" || slug === "managing-director-message";
    if (leadership) uploaded = await uploadContentImage(form);
    const imageUrl =
      uploaded ||
      (leadership && form.get("removeImage") === "on" ? null : old?.imageUrl || null);
    if (old) {
      const updated = await prisma.contentPage.updateMany({
        where: { slug, updatedAt: old.updatedAt },
        data: { ...parsed.data, imageUrl },
      });
      if (!updated.count)
        throw new ImageUploadError("This page changed. Reload and try again.");
    } else await prisma.contentPage.create({ data: { slug, ...parsed.data, imageUrl } });
    if (old?.imageUrl !== imageUrl) await removeContentImage(old?.imageUrl);
  } catch (error) {
    await removeContentImage(uploaded);
    if (error instanceof ImageUploadError) return { error: error.message };
    return { error: "Unable to save. Please try again." };
  }
  revalidatePath("/about/" + slug);
  revalidatePath("/admin/pages/" + slug);
  return { success: "Page updated on the website." };
}
