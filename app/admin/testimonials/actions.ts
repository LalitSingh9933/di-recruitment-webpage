"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { error?: string; success?: string };
export async function saveTestimonial(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      position: z.string().trim().min(2).max(180),
      quote: z.string().trim().min(10).max(2000),
      displayOrder: z.coerce.number().int().min(0).max(9999),
      published: z.boolean(),
    })
    .safeParse({
      ...Object.fromEntries(form),
      published: form.get("published") === "on",
    });
  if (!parsed.success)
    return {
      error:
        "Enter a name, role/location, testimonial (10–2,000 characters), and valid display order.",
    };
  const id = form.get("id") ? Number(form.get("id")) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id < 1))
    return { error: "Invalid testimonial." };
  try {
    if (id) await prisma.testimonial.update({ where: { id }, data: parsed.data });
    else await prisma.testimonial.create({ data: parsed.data });
  } catch {
    return { error: "Unable to save this testimonial." };
  }
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { success: "Testimonial saved." };
}
export async function deleteTestimonial(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid testimonial." };
  try {
    await prisma.testimonial.delete({ where: { id } });
  } catch {
    return { error: "Unable to delete this testimonial." };
  }
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { success: "Testimonial deleted." };
}
