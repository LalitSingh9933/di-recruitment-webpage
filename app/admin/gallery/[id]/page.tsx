import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AlbumForm,
  DeleteAlbumButton,
  GalleryUploader,
  MediaEditor,
} from "@/components/gallery-admin";

export default async function EditAlbum({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const album = await prisma.galleryAlbum.findUnique({
    where: { id },
    include: { media: { orderBy: [{ displayOrder: "asc" }, { id: "asc" }] } },
  });
  if (!album) notFound();
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Event folder</span>
          <h1>{album.title}</h1>
          <p>
            {album.media.length} photos and videos ·{" "}
            {album.published ? "Published" : "Draft"}
          </p>
        </div>
        {album.published && (
          <Link href={"/gallery/" + album.slug} className="text-link">
            View album →
          </Link>
        )}
      </div>
      <details className="admin-card padded gallery-settings">
        <summary>Edit folder settings</summary>
        <AlbumForm
          album={{
            id: album.id,
            title: album.title,
            slug: album.slug,
            description: album.description,
            eventDate: album.eventDate?.toISOString().slice(0, 10) || "",
            published: album.published,
            displayOrder: album.displayOrder,
          }}
        />
      </details>
      <GalleryUploader albumId={id} />
      <div className="gallery-admin-media">
        {album.media.map((item) => (
          <MediaEditor
            key={item.id}
            item={{
              id: item.id,
              mimeType: item.mimeType,
              originalName: item.originalName,
              caption: item.caption,
              displayOrder: item.displayOrder,
            }}
          />
        ))}
      </div>
      {!album.media.length && (
        <p className="empty">
          This folder is empty. Add media using the upload form above.
        </p>
      )}
      <div className="gallery-danger">
        <DeleteAlbumButton id={id} />
      </div>
    </div>
  );
}
