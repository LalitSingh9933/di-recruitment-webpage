import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteAlbumButton } from "@/components/gallery-admin";

export default async function AdminGallery() {
  await requireAdmin();
  const albums = await prisma.galleryAlbum.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { media: true } } },
  });
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Website content</span>
          <h1>Event gallery</h1>
          <p>Organize photos and videos into event folders.</p>
        </div>
        <Link href="/admin/gallery/new" className="btn btn-primary">
          + Create folder
        </Link>
      </div>
      <div className="gallery-admin-folders">
        {albums.map((album) => (
          <article className="admin-card padded" key={album.id}>
            <FolderOpen size={34} />
            <span className={"status " + (album.published ? "placed" : "")}>
              {album.published ? "Published" : "Draft"}
            </span>
            <h2>{album.title}</h2>
            <p>
              {album._count.media} files · Order {album.displayOrder}
            </p>
            <Link href={"/admin/gallery/" + album.id} className="btn btn-dark">
              Manage folder
            </Link>
            <DeleteAlbumButton id={album.id} />
          </article>
        ))}
      </div>
      {!albums.length && (
        <div className="admin-card empty">
          No event folders yet. Create a folder, upload your photos and videos, then
          publish it.
        </div>
      )}
      <p>
        <Link href="/gallery" className="text-link">
          View public gallery →
        </Link>
      </p>
    </div>
  );
}
