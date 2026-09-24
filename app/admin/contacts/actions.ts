"use server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteContact(_: { error?: string }, form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid submission." };
  try {
    await prisma.contactSubmission.delete({ where: { id } });
  } catch {
    return { error: "Unable to delete this submission. Please reload and try again." };
  }
  revalidatePath("/admin/contacts");
  return {};
}
