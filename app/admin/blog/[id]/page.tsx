import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { BlogForm } from "@/components/blog-form";
export default async function EditBlog({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Blog</span>
          <h1>Edit post</h1>
        </div>
      </div>
      <section className="admin-card padded">
        <BlogForm
          post={{
            id: post.id,
            imageUrl: post.imageUrl,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            published: post.published,
          }}
        />
      </section>
    </div>
  );
}
