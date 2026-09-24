"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { saveTeam, deleteTeam } from "@/app/admin/team/actions";
import { IMAGE_LIMIT, PHOTO_LIMIT_MESSAGE } from "@/lib/upload-limits";
type Member = {
  id: number;
  name: string;
  position: string;
  bio: string;
  photoUrl: string | null;
  displayOrder: number;
  published: boolean;
};

export function TeamForm({ member }: { member?: Member }) {
  const [state, action, pending] = useActionState(saveTeam, {});
  const [selected, setSelected] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (!selected) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(selected);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);

  const visiblePhoto = preview || (!removePhoto ? member?.photoUrl : null);
  return (
    <form className="admin-form" action={action}>
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="form-row">
        <label>
          Full name
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={member?.name}
          />
        </label>
        <label>
          Position
          <input
            name="position"
            required
            minLength={2}
            maxLength={120}
            defaultValue={member?.position}
            placeholder="Managing Director"
          />
        </label>
      </div>
      <label>
        Upload photo (optional)
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            if (file && file.size >= IMAGE_LIMIT) {
              setPhotoError(PHOTO_LIMIT_MESSAGE);
              setSelected(null);
              event.target.value = "";
              return;
            }
            setPhotoError("");
            setSelected(file);
            if (file) setRemovePhoto(false);
          }}
        />
      </label>
      <small>
        Choose a JPG, PNG, or WebP photo under 1 MB. Without a photo, the member’s
        initials appear.
      </small>
      {visiblePhoto && (
        <img
          className="team-upload-preview"
          src={visiblePhoto}
          alt="Team member photo preview"
        />
      )}
      {member?.photoUrl && !selected && (
        <div className="check-row">
          <label>
            <input
              name="removePhoto"
              type="checkbox"
              checked={removePhoto}
              onChange={(event) => setRemovePhoto(event.target.checked)}
            />{" "}
            Remove current photo
          </label>
        </div>
      )}
      {photoError && (
        <p className="form-error" role="alert">
          {photoError}
        </p>
      )}
      <label>
        Biography
        <textarea name="bio" rows={5} maxLength={3000} defaultValue={member?.bio} />
      </label>
      <label>
        Display order
        <input
          name="displayOrder"
          type="number"
          required
          min={0}
          max={9999}
          defaultValue={member?.displayOrder ?? 0}
        />
      </label>
      <small>
        Lower numbers appear first. For example: director 1, manager 2, recruitment
        officer 3.
      </small>
      <div className="check-row">
        <label>
          <input
            type="checkbox"
            name="published"
            defaultChecked={member?.published ?? true}
          />{" "}
          Show on public Team page
        </label>
      </div>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <div className="form-actions">
        <Link href="/admin/team" className="btn btn-outline">
          Cancel
        </Link>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save team member"}
        </button>
      </div>
    </form>
  );
}
export function DeleteTeamButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState(deleteTeam, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Delete this team member permanently?")) e.preventDefault();
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="btn btn-outline" disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error && <small role="alert">{state.error}</small>}
    </form>
  );
}
