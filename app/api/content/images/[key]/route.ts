import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { contentImagePath, contentImagePrefix } from "@/lib/content-image-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[0-9a-f-]{36}\.webp$/.test(key)) return new Response(null, { status: 404 });
  const url = contentImagePrefix + key;
  const [post, job, document, page, slide] = await Promise.all([
    prisma.blogPost.findFirst({ where: { imageUrl: url }, select: { published: true } }),
    prisma.job.findFirst({ where: { imageUrl: url }, select: { active: true } }),
    prisma.legalDocument.findFirst({ where: { url }, select: { published: true } }),
    prisma.contentPage.findFirst({ where: { imageUrl: url }, select: { slug: true } }),
    prisma.carouselSlide.findFirst({
      where: { imageUrl: url },
      select: { published: true },
    }),
  ]);
  // Draft uploads are accessible only to authenticated administrators.
  if (
    (!post && !job && !document && !page && !slide) ||
    (!(
      post?.published ||
      job?.active ||
      document?.published ||
      page ||
      slide?.published
    ) &&
      !(await getSession()))
  )
    return new Response(null, { status: 404 });
  try {
    const image = await readFile(contentImagePath(key));
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
