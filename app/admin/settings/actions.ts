"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSession, requireAdmin } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { consumeRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export type PasswordResult = { error?: string; success?: string };
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: z
      .string()
      .min(12, "Use at least 12 characters for the new password.")
      .max(128),
    confirmPassword: z.string().max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The new passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a different password.",
    path: ["newPassword"],
  });

export async function changePassword(
  _: PasswordResult,
  form: FormData,
): Promise<PasswordResult> {
  const session = await requireAdmin();
  const parsed = passwordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const key = "password-change:" + session.id;
  if (!(await consumeRateLimit("password-change", key, 5)))
    return { error: "Too many attempts. Please try again in 15 minutes." };

  const admin = await prisma.admin.findUnique({ where: { id: session.id } });
  if (
    !admin ||
    !admin.active ||
    !verifyPassword(parsed.data.currentPassword, admin.passwordHash)
  )
    return { error: "Your current password is incorrect." };

  try {
    // Guard against two simultaneous changes using the same previous password.
    const changed = await prisma.admin.updateMany({
      where: { id: admin.id, active: true, passwordHash: admin.passwordHash },
      data: { passwordHash: hashPassword(parsed.data.newPassword) },
    });
    if (changed.count !== 1)
      return { error: "Your password changed in another session. Please sign in again." };
    await createSession(admin.id, admin.email);
  } catch {
    return {
      error:
        "Unable to finish the password change. Please sign in again before retrying.",
    };
  }
  revalidatePath("/admin/settings");
  return { success: "Password changed. Your other sessions have been signed out." };
}
