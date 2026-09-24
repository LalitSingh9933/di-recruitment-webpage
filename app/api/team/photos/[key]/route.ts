import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { teamPhotoPath } from "@/lib/team-photo-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[0-9a-f-]{36}\.webp$/.test(key)) return new Response(null, { status: 404 });
  const member = await prisma.teamMember.findFirst({
    where: { photoUrl: "/api/team/photos/" + key },
  });
  // An uploaded draft portrait must follow the same visibility rules as its profile.
  if (!member || (!member.published && !(await getSession())))
    return new Response(null, { status: 404 });
  try {
    const image = await readFile(teamPhotoPath(key));
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
