import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { DeleteBlogButton } from "@/components/blog-form";

export default async function AdminBlog() {
  await requireAdmin();
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Website content</span>
          <h1>Blog posts</h1>
          <p>Publish news and career advice for your readers.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/blog/new">
          + Add post
        </Link>
      </div>
      <section className="admin-card">
        <div className="admin-table">
          <div className="table-row table-head">
            <span>Title</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {posts.map((post) => (
            <div className="table-row" key={post.id}>
              <span>
                <b>{post.title}</b>
                {post.published && (
                  <Link className="text-link" href={"/blog/" + post.slug}>
                    View article
                  </Link>
                )}
              </span>
              <span className={"status " + (post.published ? "placed" : "")}>
                {post.published ? "Published" : "Draft"}
              </span>
              <span>{post.updatedAt.toLocaleDateString()}</span>
              <div className="blog-actions">
                <Link className="text-link" href={"/admin/blog/" + post.id}>
                  Edit
                </Link>
                <DeleteBlogButton id={post.id} />
              </div>
            </div>
          ))}
        </div>
        {!posts.length && (
          <div className="empty">
            No posts yet. Add your first article and select “Publish on website”.
          </div>
        )}
      </section>
    </div>
  );
}
