import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentPages, isContentSlug } from "@/lib/content-pages";
import { ContentPageForm } from "@/components/content-page-form";
export default async function EditContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  if (!isContentSlug(slug)) notFound();
  const saved = await prisma.contentPage.findUnique({ where: { slug } });
  const page = saved || contentPages[slug];
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>About pages</span>
          <h1>{page.title}</h1>
        </div>
        <Link className="text-link" href={"/about/" + slug}>
          View page →
        </Link>
      </div>
      <section className="admin-card padded">
        <ContentPageForm
          slug={slug}
          title={page.title}
          content={page.content}
          imageUrl={saved?.imageUrl}
        />
      </section>
      {slug === "legal-documents" && (
        <p>
          <Link className="text-link" href="/admin/documents">
            Manage document images →
          </Link>
        </p>
      )}
    </div>
  );
}
