"use client";
import { useActionState } from "react";
import { saveJobAction } from "@/app/admin/actions";
import { ContentImageInput } from "@/components/content-image-input";

type JobInput = {
  id?: number;
  imageUrl?: string | null;
  title?: string;
  slug?: string;
  company?: string;
  country?: string;
  city?: string | null;
  category?: string;
  type?: string;
  salary?: string | null;
  vacancies?: number;
  description?: string;
  requirements?: string;
  featured?: boolean;
  active?: boolean;
};
export function JobForm({ job = {} }: { job?: JobInput }) {
  const [state, action, pending] = useActionState(saveJobAction, {});
  return (
    <form action={action} className="admin-form">
      {job.id && <input type="hidden" name="id" value={job.id} />}
      <div className="form-row">
        <label>
          Job title
          <input name="title" required defaultValue={job.title} />
        </label>
        <label>
          URL slug
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            defaultValue={job.slug}
            placeholder="hotel-housekeeper-greece"
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Employer / company
          <input name="company" required defaultValue={job.company} />
        </label>
        <label>
          Category
          <input name="category" required defaultValue={job.category} />
        </label>
      </div>
      <div className="form-row form-three">
        <label>
          Country
          <input name="country" required defaultValue={job.country} />
        </label>
        <label>
          City
          <input name="city" defaultValue={job.city || ""} />
        </label>
        <label>
          Employment type
          <input name="type" required defaultValue={job.type || "Full-time"} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Salary display
          <input
            name="salary"
            defaultValue={job.salary || ""}
            placeholder="€900–€1,150 / month"
          />
        </label>
        <label>
          Number of vacancies
          <input
            name="vacancies"
            type="number"
            min="1"
            required
            defaultValue={job.vacancies || 1}
          />
        </label>
      </div>
      <label>
        Description
        <textarea name="description" rows={5} required defaultValue={job.description} />
      </label>
      <label>
        Requirements
        <textarea name="requirements" rows={5} required defaultValue={job.requirements} />
      </label>
      <ContentImageInput current={job.imageUrl} />
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="check-row">
        <label>
          <input type="checkbox" name="active" defaultChecked={job.active ?? true} />{" "}
          Published and visible
        </label>
        <label>
          <input type="checkbox" name="featured" defaultChecked={job.featured} /> Featured
          opportunity
        </label>
      </div>
      <div className="form-actions">
        <a className="btn btn-outline" href="/admin/jobs">
          Cancel
        </a>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : job.id ? "Save changes" : "Publish job"}
        </button>
      </div>
    </form>
  );
}
