"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { removeTeamPhoto, storeTeamPhoto } from "@/lib/team-photo-storage";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  position: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(3000),
  displayOrder: z.coerce.number().int().min(0).max(9999),
  published: z.boolean(),
});
export type TeamResult = { error?: string };
export async function saveTeam(_: TeamResult, form: FormData): Promise<TeamResult> {
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
  const id = form.get("id") ? Number(form.get("id")) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id < 1))
    return { error: "Invalid team member." };
  const previous = id ? await prisma.teamMember.findUnique({ where: { id } }) : null;
  if (id && !previous) return { error: "This team member no longer exists." };
  const photo = form.get("photo");
  let uploaded: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      uploaded = await storeTeamPhoto(photo);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unable to upload the photo.",
      };
    }
  }
  const photoUrl =
    uploaded || (form.get("removePhoto") === "on" ? null : (previous?.photoUrl ?? null));
  try {
    const data = { ...parsed.data, photoUrl };
    if (previous) {
      // Do not overwrite another editor's new photo with a stale profile.
      const saved = await prisma.teamMember.updateMany({
        where: { id: previous.id, updatedAt: previous.updatedAt },
        data,
      });
      if (saved.count !== 1) {
        if (uploaded) await removeTeamPhoto(uploaded);
        return {
          error: "This member changed while you were editing. Reload and try again.",
        };
      }
    } else await prisma.teamMember.create({ data });
  } catch {
    if (uploaded) await removeTeamPhoto(uploaded);
    return { error: "Unable to save this team member. Please try again." };
  }
  if (previous?.photoUrl && previous.photoUrl !== photoUrl)
    await removeTeamPhoto(previous.photoUrl);
  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect("/admin/team");
}
export async function deleteTeam(_: TeamResult, form: FormData): Promise<TeamResult> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid team member." };
  try {
    const removed = await prisma.teamMember.delete({ where: { id } });
    await removeTeamPhoto(removed.photoUrl);
  } catch {
    return { error: "Unable to delete this team member." };
  }
  revalidatePath("/team");
  revalidatePath("/admin/team");
  return {};
}
