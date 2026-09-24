"use client";
import { useActionState } from "react";
import { saveTestimonial, deleteTestimonial } from "@/app/admin/testimonials/actions";

type Entry = {
  id: number;
  name: string;
  position: string;
  quote: string;
  displayOrder: number;
  published: boolean;
};
export function TestimonialForm({ entry }: { entry?: Entry }) {
  const [result, action, pending] = useActionState(saveTestimonial, {});
  const [deleted, remove, deleting] = useActionState(deleteTestimonial, {});
  return (
    <section className="admin-card padded document-editor">
      <h2>{entry ? "Edit testimonial" : "Add testimonial"}</h2>
      <form action={action} className="admin-form">
        {entry && <input type="hidden" name="id" value={entry.id} />}
        <label>
          Person’s name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={entry?.name}
          />
        </label>
        <label>
          Role and location
          <input
            name="position"
            required
            minLength={2}
            maxLength={180}
            defaultValue={entry?.position}
            placeholder="Hospitality professional · Greece"
          />
        </label>
        <label>
          Testimonial
          <textarea
            name="quote"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            defaultValue={entry?.quote}
          />
        </label>
        <label>
          Display order
          <input
            name="displayOrder"
            type="number"
            required
            min={0}
            max={9999}
            defaultValue={entry?.displayOrder ?? 0}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            name="published"
            defaultChecked={entry?.published ?? false}
          />{" "}
          Publish on homepage
        </label>
        <p role="status">{result.error || result.success}</p>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save testimonial"}
        </button>
      </form>
      {entry && (
        <form
          action={remove}
          onSubmit={(e) => {
            if (!confirm("Permanently delete this testimonial?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={entry.id} />
          <button className="btn btn-outline" disabled={deleting}>
            Delete testimonial
          </button>
          <p role="status">{deleted.error}</p>
        </form>
      )}
    </section>
  );
}
