"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  uploadContentImage,
  removeContentImage,
  ImageUploadError,
} from "@/lib/content-image-storage";
import { createSession, destroySession, requireAdmin, verifyPassword } from "@/lib/auth";

export async function loginAction(_: { error?: string }, formData: FormData) {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");
  if (!z.string().email().max(254).safeParse(email).success || password.length > 128)
    return { error: "Invalid email or password." };
  let admin;
  try {
    if (!(await consumeRateLimit("login", email, 10)))
      return { error: "Too many sign-in attempts. Try again in 15 minutes." };
    admin = await prisma.admin.findUnique({ where: { email } });
  } catch {
    return { error: "Sign-in is temporarily unavailable. Please try again." };
  }
  if (!admin || !admin.active || !verifyPassword(password, admin.passwordHash))
    return { error: "Invalid email or password." };
  await createSession(admin.id, admin.email);
  redirect("/admin");
}
export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const jobSchema = z.object({
  title: z.string().min(3),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/),
  company: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional(),
  category: z.string().min(2),
  type: z.string().min(2),
  salary: z.string().optional(),
  vacancies: z.coerce.number().int().positive(),
  description: z.string().min(10),
  requirements: z.string().min(10),
  featured: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(false),
});
export async function saveJobAction(
  _: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();
  const raw = Object.fromEntries(formData);
  const parsed = jobSchema.safeParse({
    ...raw,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues
        .map((issue) => issue.path.join(".") + ": " + issue.message)
        .join(" "),
    };
  const data = parsed.data;
  const id = Number(formData.get("id"));
  if (formData.get("id") && (!Number.isInteger(id) || id < 1))
    return { error: "Invalid job." };
  let uploaded: string | null = null;
  try {
    uploaded = await uploadContentImage(formData);
    if (id) {
      const old = await prisma.job.findUnique({ where: { id } });
      if (!old) throw new ImageUploadError("This job no longer exists.");
      const imageUrl =
        uploaded || (formData.get("removeImage") === "on" ? null : old.imageUrl);
      const updated = await prisma.job.updateMany({
        where: { id, updatedAt: old.updatedAt },
        data: { ...data, imageUrl },
      });
      if (!updated.count)
        throw new ImageUploadError("This job changed. Reload and try again.");
      if (old.imageUrl !== imageUrl) await removeContentImage(old.imageUrl);
    } else await prisma.job.create({ data: { ...data, imageUrl: uploaded } });
  } catch (error) {
    await removeContentImage(uploaded);
    if (error instanceof ImageUploadError) return { error: error.message };
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return { error: "That URL slug is already used. Choose another." };
    return { error: "Unable to save this job. Please try again." };
  }
  revalidatePath("/");
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  redirect("/admin/jobs");
}
export async function deleteJobAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const job = await prisma.job.delete({ where: { id } });
  await removeContentImage(job.imageUrl);
  revalidatePath("/");
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}
export async function updateApplicationStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = z
    .enum(["RECEIVED", "REVIEWING", "SHORTLISTED", "REJECTED", "PLACED"])
    .parse(formData.get("status"));
  await prisma.application.update({ where: { id }, data: { status } });
  revalidatePath("/admin/applications");
}
