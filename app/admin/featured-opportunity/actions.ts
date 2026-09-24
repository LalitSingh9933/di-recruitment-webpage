"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  featuredOpportunityKey,
  featuredOpportunitySchema,
} from "@/lib/featured-opportunity";

type Result = { error?: string; success?: string };
export async function saveFeaturedOpportunity(
  _: Result,
  form: FormData,
): Promise<Result> {
  await requireAdmin();
  const parsed = featuredOpportunitySchema.safeParse({
    ...Object.fromEntries(form),
    published: form.get("published") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues
        .map((issue) => issue.path.join(".") + ": " + issue.message)
        .join(" "),
    };
  try {
    const data = { title: parsed.data.title, content: JSON.stringify(parsed.data) };
    await prisma.contentPage.upsert({
      where: { slug: featuredOpportunityKey },
      create: { slug: featuredOpportunityKey, ...data },
      update: data,
    });
  } catch {
    return { error: "Unable to save the featured opportunity. Please try again." };
  }
  revalidatePath("/");
  revalidatePath("/admin/featured-opportunity");
  return {
    success: parsed.data.published
      ? "Featured opportunity published on the homepage."
      : "Saved as draft. Hidden from the homepage.",
  };
}
export async function deleteFeaturedOpportunity(
  _: Result,
  _form: FormData,
): Promise<Result> {
  await requireAdmin();
  try {
    await prisma.contentPage.deleteMany({ where: { slug: featuredOpportunityKey } });
  } catch {
    return { error: "Unable to delete the featured opportunity." };
  }
  revalidatePath("/");
  revalidatePath("/admin/featured-opportunity");
  return { success: "Featured opportunity deleted. Your job listings are unchanged." };
}
