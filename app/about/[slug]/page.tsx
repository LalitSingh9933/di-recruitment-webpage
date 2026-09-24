import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import { contentPages, isContentSlug } from "@/lib/content-pages";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isContentSlug(slug)) return { title: "Page not found" };
  const saved = await prisma.contentPage.findUnique({ where: { slug } });
  return {
    title: (saved?.title || contentPages[slug].title) + " | D.I. Recruitment",
    description: contentPages[slug].description,
  };
}
export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isContentSlug(slug)) notFound();
  const defaults = contentPages[slug];
  const saved = await prisma.contentPage.findUnique({ where: { slug } });
  const documents =
    slug === "legal-documents"
      ? await prisma.legalDocument.findMany({
          where: { published: true },
          orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
        })
      : [];
  return (
    <>
      <Navbar />
      <main className="section blog-section">
        <div className="container about-layout">
          <aside className="about-sidebar">
            <h2>About D.I.</h2>
            {Object.entries(contentPages).map(([key, page]) => (
              <Link
                key={key}
                href={"/about/" + key}
                aria-current={slug === key ? "page" : undefined}
              >
                {page.title}
              </Link>
            ))}
            <Link href="/team">Our Team</Link>
          </aside>
          <article className="blog-article">
            <div className="eyebrow">
              <span />
              {defaults.eyebrow}
            </div>
            <h1>{saved?.title || defaults.title}</h1>
            <p className="blog-lead">{defaults.description}</p>
            {saved?.imageUrl && (
              <img
                className="leadership-portrait"
                src={saved.imageUrl}
                alt={
                  slug === "chairman-message"
                    ? "Chairman of D.I. Recruitment"
                    : "Managing Director of D.I. Recruitment"
                }
              />
            )}
            <div className="blog-prose">{saved?.content ?? defaults.content}</div>
            {slug === "legal-documents" && (
              <div className="legal-documents">
                {documents.length ? (
                  documents.map((doc) => (
                    <a
                      className="legal-document"
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {doc.url.startsWith("/api/content/images/") ? (
                        <img
                          className="legal-document-image"
                          src={doc.url}
                          alt={doc.title}
                          loading="lazy"
                        />
                      ) : (
                        <FileText />
                      )}
                      <span>
                        {doc.title}
                        <small>Open document in a new tab</small>
                      </span>
                      <ArrowUpRight />
                    </a>
                  ))
                ) : (
                  <p className="blog-empty">
                    No documents have been published yet. Contact us to request
                    information.
                  </p>
                )}
              </div>
            )}
            <Link className="btn btn-dark" href="/contact">
              Contact our team
            </Link>
          </article>
        </div>
      </main>
    </>
  );
}
