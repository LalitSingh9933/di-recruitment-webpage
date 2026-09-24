import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { GalleryMedia } from "@/components/gallery-media";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const album = await prisma.galleryAlbum.findFirst({
    where: { slug: (await params).slug, published: true },
    select: { title: true, description: true },
  });
  return {
    title: album ? album.title + " | D.I. Event Gallery" : "Album not found",
    description: album?.description,
  };
}
export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const album = await prisma.galleryAlbum.findFirst({
    where: { slug: (await params).slug, published: true },
    include: {
      media: {
        orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
        select: { id: true, mimeType: true, originalName: true, caption: true },
      },
    },
  });
  if (!album) notFound();
  return (
    <>
      <Navbar />
      <main className="section blog-section">
        <div className="container">
          <Link href="/gallery" className="text-link">
            ← All event folders
          </Link>
          <div className="section-heading gallery-album-heading">
            <div className="eyebrow">
              <span /> Event gallery
            </div>
            <h1>{album.title}</h1>
            {album.eventDate && (
              <time dateTime={album.eventDate.toISOString()}>
                {album.eventDate.toLocaleDateString("en", {
                  dateStyle: "long",
                  timeZone: "UTC",
                })}
              </time>
            )}
            <p className="blog-intro">{album.description}</p>
          </div>
          <GalleryMedia media={album.media} />
        </div>
      </main>
    </>
  );
}
