"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function submitContact(
  _: { error?: string; success?: string },
  form: FormData,
): Promise<{ error?: string; success?: string }> {
  const data = z
    .object({
      fullName: z.string().trim().min(2).max(100),
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((s) => s.toLowerCase()),
      phone: z
        .string()
        .trim()
        .min(7)
        .max(30)
        .regex(/^[+\d\s().-]+$/),
      subject: z.string().trim().min(3).max(180),
      message: z.string().trim().min(10).max(5000),
    })
    .safeParse(Object.fromEntries(form));
  if (!data.success)
    return {
      error:
        "Please enter your name, a valid email and phone, a subject, and a message (10–5,000 characters).",
    };
  // A honeypot and per-email submission limit reduce basic automated spam.
  if (form.get("website")) return { success: "Thank you. Your message has been sent." };
  try {
    if (!(await consumeRateLimit("contact", data.data.email, 3)))
      return { error: "You have sent several messages. Please try again in 15 minutes." };
    await prisma.contactSubmission.create({ data: data.data });
  } catch {
    return { error: "Unable to send your message. Please try again." };
  }
  revalidatePath("/admin/contacts");
  return {
    success: "Thank you. Your message has been sent. Our team will contact you soon.",
  };
}
