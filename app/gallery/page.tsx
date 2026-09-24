import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Event Gallery | D.I. Recruitment",
  description: "Photos and videos from D.I. Recruitment events.",
};
export default async function GalleryPage() {
  const albums = await prisma.galleryAlbum.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { media: true } },
      media: {
        where: { mimeType: { startsWith: "image/" } },
        orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
        take: 1,
      },
    },
  });
  return (
    <>
      <Navbar />
      <main className="section blog-section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">
              <span /> Life at D.I.
            </div>
            <h2>
              Moments that <em>bring us together.</em>
            </h2>
            <p className="blog-intro">
              Explore photos and videos from our events, training sessions, and shared
              milestones.
            </p>
          </div>
          <div className="blog-grid">
            {albums.map((album) => (
              <article className="blog-card" key={album.id}>
                <Link
                  href={"/gallery/" + album.slug}
                  className="gallery-album-cover"
                  aria-label={"Open " + album.title}
                >
                  {album.media[0] ? (
                    <img
                      src={"/api/gallery/media/" + album.media[0].id}
                      alt={album.title}
                      loading="lazy"
                    />
                  ) : (
                    <FolderOpen size={55} />
                  )}
                  <span>{album._count.media} files</span>
                </Link>
                <div className="blog-card-body">
                  {album.eventDate && (
                    <time dateTime={album.eventDate.toISOString()}>
                      {album.eventDate.toLocaleDateString("en", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                  )}
                  <h3>
                    <Link href={"/gallery/" + album.slug}>{album.title}</Link>
                  </h3>
                  <p>{album.description}</p>
                  <Link href={"/gallery/" + album.slug} className="text-link">
                    Explore album <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {!albums.length && (
            <div className="blog-empty">
              <FolderOpen size={35} />
              <h3>New memories are on their way.</h3>
              <p>Our event albums will appear here once published.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
