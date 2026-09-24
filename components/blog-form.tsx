"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveBlog, deleteBlog } from "@/app/admin/blog/actions";
import { ContentImageInput } from "@/components/content-image-input";

type PostInput = {
  id: number;
  imageUrl?: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
};
export function BlogForm({ post }: { post?: PostInput }) {
  const [state, action, pending] = useActionState(saveBlog, {});
  const [slug, setSlug] = useState(post?.slug || "");
  const [manualSlug, setManualSlug] = useState(!!post);
  return (
    <form className="admin-form" action={action}>
      {post && <input type="hidden" name="id" value={post.id} />}
      <label>
        Title
        <input
          name="title"
          defaultValue={post?.title}
          required
          minLength={3}
          maxLength={180}
          onChange={(e) => {
            if (!manualSlug)
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
          }}
        />
      </label>
      <label>
        URL slug
        <input
          name="slug"
          required
          value={slug}
          maxLength={180}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          onChange={(e) => {
            setManualSlug(true);
            setSlug(e.target.value);
          }}
        />
      </label>
      <label>
        Short introduction
        <textarea
          name="excerpt"
          defaultValue={post?.excerpt}
          required
          minLength={10}
          maxLength={500}
          rows={3}
        />
      </label>
      <label>
        Article
        <textarea
          name="content"
          defaultValue={post?.content}
          required
          minLength={20}
          maxLength={100000}
          rows={16}
        />
      </label>
      <small>
        Use blank lines between paragraphs. Text is displayed safely as written.
      </small>
      <ContentImageInput current={post?.imageUrl} />
      <div className="check-row">
        <label>
          <input
            type="checkbox"
            name="published"
            defaultChecked={post?.published ?? false}
          />{" "}
          Publish on website
        </label>
      </div>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <div className="form-actions">
        <Link className="btn btn-outline" href="/admin/blog">
          Cancel
        </Link>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save post"}
        </button>
      </div>
    </form>
  );
}

export function DeleteBlogButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState(deleteBlog, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Delete this post permanently?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-outline" disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error && <small role="alert">{state.error}</small>}
    </form>
  );
}
