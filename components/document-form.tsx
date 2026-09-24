"use client";
import { useActionState } from "react";
import { saveDocument, deleteDocument } from "@/app/admin/documents/actions";
import { ContentImageInput } from "@/components/content-image-input";
type Document = {
  id: number;
  title: string;
  url: string;
  displayOrder: number;
  published: boolean;
};
export function DocumentForm({ document }: { document?: Document }) {
  const [result, action, pending] = useActionState(saveDocument, {});
  const [deleted, remove, deleting] = useActionState(deleteDocument, {});
  return (
    <section className="admin-card padded document-editor">
      <h2>{document ? document.title : "Add document"}</h2>
      <form action={action} className="admin-form">
        {document && <input type="hidden" name="id" value={document.id} />}
        <label>
          Document title
          <input
            name="title"
            defaultValue={document?.title}
            required
            minLength={3}
            maxLength={180}
          />
        </label>
        <ContentImageInput
          key={document?.url || result.success || "new"}
          current={document?.url}
          required
        />
        <label>
          Display order
          <input
            name="displayOrder"
            type="number"
            min={0}
            max={9999}
            required
            defaultValue={document?.displayOrder ?? 0}
          />
        </label>
        <div className="check-row">
          <label>
            <input
              type="checkbox"
              name="published"
              defaultChecked={document?.published ?? false}
            />{" "}
            Publish document
          </label>
        </div>
        <p role="status">{result.error || result.success}</p>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save document"}
        </button>
      </form>
      {document && (
        <form
          action={remove}
          onSubmit={(e) => {
            if (!window.confirm("Remove this document from the website?"))
              e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={document.id} />
          <button className="btn btn-outline" disabled={deleting}>
            Delete document
          </button>
          <small role="status">{deleted.error}</small>
        </form>
      )}
    </section>
  );
}
