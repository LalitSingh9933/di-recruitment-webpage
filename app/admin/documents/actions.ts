"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  uploadContentImage,
  removeContentImage,
  ImageUploadError,
} from "@/lib/content-image-storage";
export type DocumentResult = { error?: string; success?: string };
export async function saveDocument(
  _: DocumentResult,
  form: FormData,
): Promise<DocumentResult> {
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
    return {
      error: "Enter a title and a valid display order.",
    };
  const id = form.get("id") ? Number(form.get("id")) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id < 1))
    return { error: "Invalid document." };
  let uploaded: string | null = null;
  try {
    uploaded = await uploadContentImage(form);
    const old = id ? await prisma.legalDocument.findUnique({ where: { id } }) : null;
    if (id && !old) throw new ImageUploadError("This document no longer exists.");
    const url = uploaded || old?.url;
    if (!url) throw new ImageUploadError("Please upload a document image.");
    if (id && old) {
      const updated = await prisma.legalDocument.updateMany({
        where: { id, url: old.url },
        data: { ...parsed.data, url },
      });
      if (!updated.count)
        throw new ImageUploadError("This document changed. Reload and try again.");
      if (old.url !== url) await removeContentImage(old.url);
    } else await prisma.legalDocument.create({ data: { ...parsed.data, url } });
  } catch (error) {
    await removeContentImage(uploaded);
    if (error instanceof ImageUploadError) return { error: error.message };
    return { error: "Unable to save the document." };
  }
  revalidatePath("/admin/documents");
  revalidatePath("/about/legal-documents");
  return { success: "Document saved." };
}
export async function deleteDocument(
  _: DocumentResult,
  form: FormData,
): Promise<DocumentResult> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid document." };
  try {
    const document = await prisma.legalDocument.delete({ where: { id } });
    await removeContentImage(document.url);
  } catch {
    return { error: "Unable to delete the document." };
  }
  revalidatePath("/admin/documents");
  revalidatePath("/about/legal-documents");
  return { success: "Document removed." };
}
