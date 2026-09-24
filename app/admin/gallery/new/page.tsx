import { requireAdmin } from "@/lib/auth";
import { AlbumForm } from "@/components/gallery-admin";
export default async function NewAlbum() {
  await requireAdmin();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Event gallery</span>
          <h1>Create event folder</h1>
          <p>Save the folder first, then add its photos and videos.</p>
        </div>
      </div>
      <section className="admin-card padded">
        <AlbumForm />
      </section>
    </div>
  );
}
