import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { contentPages } from "@/lib/content-pages";
export default async function Pages() {
  await requireAdmin();
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Website content</span>
          <h1>About pages</h1>
          <p>
            Edit your introduction, purpose, leadership messages, and legal information.
          </p>
        </div>
      </div>
      <div className="admin-card">
        {Object.entries(contentPages).map(([slug, page]) => (
          <div className="content-page-row" key={slug}>
            <div>
              <h2>{page.title}</h2>
              <p>{page.description}</p>
            </div>
            <Link className="btn btn-outline" href={"/admin/pages/" + slug}>
              Edit page
            </Link>
          </div>
        ))}
      </div>
      <p>
        <Link href="/admin/team" className="text-link">
          Manage team members →
        </Link>
      </p>
      <p>
        <Link href="/admin/documents" className="text-link">
          Manage legal documents →
        </Link>
      </p>
    </div>
  );
}
