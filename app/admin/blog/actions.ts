"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  uploadContentImage,
  removeContentImage,
  ImageUploadError,
} from "@/lib/content-image-storage";

const schema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20).max(100000),
  published: z.boolean(),
});
export type BlogResult = { error?: string };

export async function saveBlog(_: BlogResult, form: FormData): Promise<BlogResult> {
  await requireAdmin();
  const parsed = schema.safeParse({
    ...Object.fromEntries(form),
    published: form.get("published") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join(" "),
    };
  const rawId = form.get("id");
  const id = rawId ? Number(rawId) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id < 1))
    return { error: "Invalid post." };
  let oldSlug: string | undefined;
  let uploaded: string | null = null;
  try {
    uploaded = await uploadContentImage(form);
    if (id) {
      const old = await prisma.blogPost.findUnique({ where: { id } });
      if (!old) throw new ImageUploadError("This post no longer exists.");
      oldSlug = old.slug;
      const imageUrl =
        uploaded || (form.get("removeImage") === "on" ? null : old.imageUrl);
      const updated = await prisma.blogPost.updateMany({
        where: { id, updatedAt: old.updatedAt },
        data: { ...parsed.data, imageUrl },
      });
      if (!updated.count)
        throw new ImageUploadError("This post changed. Reload and try again.");
      if (old.imageUrl !== imageUrl) await removeContentImage(old.imageUrl);
    } else {
      await prisma.blogPost.create({ data: { ...parsed.data, imageUrl: uploaded } });
    }
  } catch (error) {
    await removeContentImage(uploaded);
    if (error instanceof ImageUploadError) return { error: error.message };
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return { error: "That URL slug is already used. Choose another." };
    return { error: "Unable to save your post. Please try again." };
  }
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/" + parsed.data.slug);
  if (oldSlug) revalidatePath("/blog/" + oldSlug);
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function deleteBlog(_: BlogResult, form: FormData): Promise<BlogResult> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid post." };
  try {
    const post = await prisma.blogPost.delete({ where: { id } });
    await removeContentImage(post.imageUrl);
    revalidatePath("/blog/" + post.slug);
  } catch {
    return { error: "Unable to delete this post." };
  }
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return {};
}
