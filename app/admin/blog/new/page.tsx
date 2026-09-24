import { requireAdmin } from "@/lib/auth";
import { BlogForm } from "@/components/blog-form";
export default async function NewBlog() {
  await requireAdmin();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Blog</span>
          <h1>Write a new post</h1>
        </div>
      </div>
      <section className="admin-card padded">
        <BlogForm />
      </section>
    </div>
  );
}
