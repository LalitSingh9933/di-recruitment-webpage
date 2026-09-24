import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";

export async function BlogList({ limit }: { limit?: number }) {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      createdAt: true,
      imageUrl: true,
    },
  });
  if (!posts.length)
    return (
      <div className="blog-empty">
        <BookOpen size={30} />
        <h3>Our next story is on its way.</h3>
        <p>Check back for updates from D.I. Recruitment.</p>
      </div>
    );
  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <article key={post.id} className="blog-card">
          {post.imageUrl ? (
            <Link href={"/blog/" + post.slug}>
              <img
                className="blog-cover"
                src={post.imageUrl}
                alt={post.title}
                loading="lazy"
              />
            </Link>
          ) : (
            <div className="blog-card-art">
              <BookOpen size={32} />
              <span>D.I. JOURNAL</span>
            </div>
          )}
          <div className="blog-card-body">
            <time dateTime={post.createdAt.toISOString()}>
              {post.createdAt.toLocaleDateString("en", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            <h3>
              <Link href={"/blog/" + post.slug}>{post.title}</Link>
            </h3>
            <p>{post.excerpt}</p>
            <Link className="text-link" href={"/blog/" + post.slug}>
              Read article <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
