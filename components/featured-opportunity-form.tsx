"use client";
import { useActionState } from "react";
import type { FeaturedOpportunity } from "@/lib/featured-opportunity";
import {
  saveFeaturedOpportunity,
  deleteFeaturedOpportunity,
} from "@/app/admin/featured-opportunity/actions";

export function FeaturedOpportunityForm({
  entry,
}: {
  entry: FeaturedOpportunity | null;
}) {
  const [result, action, pending] = useActionState(saveFeaturedOpportunity, {});
  const [deleted, remove, deleting] = useActionState(deleteFeaturedOpportunity, {});
  return (
    <section className="admin-card padded">
      <h2>{entry ? "Edit featured opportunity" : "Add featured opportunity"}</h2>
      <form className="admin-form" action={action}>
        <label>
          Title
          <input
            name="title"
            required
            minLength={3}
            maxLength={180}
            defaultValue={entry?.title}
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={500}
            rows={4}
            defaultValue={entry?.description}
          />
        </label>
        <div className="form-row">
          <label>
            Short badge (for example GR)
            <input name="badge" required maxLength={8} defaultValue={entry?.badge} />
          </label>
          <label>
            Location
            <input
              name="location"
              required
              minLength={2}
              maxLength={100}
              defaultValue={entry?.location}
            />
          </label>
        </div>
        <label>
          Number of openings
          <input
            name="openings"
            type="number"
            min={1}
            max={100000}
            required
            defaultValue={entry?.openings ?? 1}
          />
        </label>
        <label className="check-row">
          <input
            name="published"
            type="checkbox"
            defaultChecked={entry?.published ?? true}
          />{" "}
          Show on homepage
        </label>
        <p role="status">{result.error || result.success}</p>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save featured opportunity"}
        </button>
      </form>
      {entry && (
        <form
          action={remove}
          onSubmit={(event) => {
            if (
              !confirm(
                "Delete the homepage featured opportunity? Job listings and applications will not be deleted.",
              )
            )
              event.preventDefault();
          }}
        >
          <button className="btn btn-outline" disabled={deleting}>
            {deleting ? "Deleting…" : "Delete featured opportunity"}
          </button>
          <p role="status">{deleted.error || deleted.success}</p>
        </form>
      )}
    </section>
  );
}
