import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentForm } from "@/components/document-form";
export default async function Documents() {
  await requireAdmin();
  const documents = await prisma.legalDocument.findMany({
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Website content</span>
          <h1>Legal documents</h1>
          <p>Upload images of your registration and licensing documents (under 1 MB).</p>
        </div>
        <Link className="text-link" href="/about/legal-documents">
          View page →
        </Link>
      </div>
      <DocumentForm />
      {documents.map((doc) => (
        <DocumentForm key={doc.id} document={doc} />
      ))}
    </div>
  );
}
