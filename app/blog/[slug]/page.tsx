import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: (await params).slug, published: true },
    select: { title: true, excerpt: true },
  });
  return {
    title: post ? post.title + " | D.I. Recruitment" : "Article not found",
    description: post?.excerpt,
  };
}
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: (await params).slug, published: true },
  });
  if (!post) notFound();
  return (
    <>
      <Navbar />
      <main className="section blog-section">
        <article className="container blog-article">
          <Link className="text-link" href="/blog">
            ← All articles
          </Link>
          <div className="eyebrow">The D.I. journal</div>
          <h1>{post.title}</h1>
          <time dateTime={post.createdAt.toISOString()}>
            {post.createdAt.toLocaleDateString("en", { dateStyle: "long" })}
          </time>
          <p className="blog-lead">{post.excerpt}</p>
          {post.imageUrl && (
            <img className="article-cover" src={post.imageUrl} alt={post.title} />
          )}
          <div className="blog-prose">{post.content}</div>
          <Link className="btn btn-dark" href="/contact">
            Talk to our team
          </Link>
        </article>
      </main>
    </>
  );
}
