"use client";
import { useActionState } from "react";
import { saveContent } from "@/app/admin/pages/actions";
import { ContentImageInput } from "@/components/content-image-input";
export function ContentPageForm({
  slug,
  title,
  content,
  imageUrl,
}: {
  slug: string;
  title: string;
  content: string;
  imageUrl?: string | null;
}) {
  const [result, action, pending] = useActionState(saveContent, {});
  return (
    <form className="admin-form" action={action}>
      <input name="slug" value={slug} type="hidden" />
      <label>
        Page title
        <input name="title" defaultValue={title} required minLength={3} maxLength={180} />
      </label>
      <label>
        Page content
        <textarea
          name="content"
          defaultValue={content}
          required
          minLength={20}
          maxLength={100000}
          rows={18}
        />
      </label>
      <small>Use blank lines between sections and paragraphs.</small>
      {(slug === "chairman-message" || slug === "managing-director-message") && (
        <ContentImageInput key={imageUrl || "empty"} current={imageUrl} />
      )}
      {result.error && (
        <p className="form-error" role="alert">
          {result.error}
        </p>
      )}
      {result.success && <p role="status">{result.success}</p>}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save page"}
      </button>
    </form>
  );
}
