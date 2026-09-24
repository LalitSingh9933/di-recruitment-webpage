"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import {
  IMAGE_LIMIT,
  VIDEO_LIMIT,
  PHOTO_LIMIT_MESSAGE,
  VIDEO_LIMIT_MESSAGE,
} from "@/lib/upload-limits";
import {
  deleteAlbum,
  deleteMedia,
  saveAlbum,
  saveMedia,
} from "@/app/admin/gallery/actions";

type AlbumInput = {
  id: number;
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  displayOrder: number;
  published: boolean;
};

export function AlbumForm({ album }: { album?: AlbumInput }) {
  const [result, action, pending] = useActionState(saveAlbum, {});
  const [slug, setSlug] = useState(album?.slug || "");
  const [manualSlug, setManualSlug] = useState(!!album);
  return (
    <form className="admin-form" action={action}>
      {album && <input name="id" type="hidden" value={album.id} />}
      <label>
        Event / folder name
        <input
          name="title"
          required
          minLength={3}
          maxLength={180}
          defaultValue={album?.title}
          placeholder="Annual Team Gathering"
          onChange={(event) => {
            if (!manualSlug)
              setSlug(
                event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
          }}
        />
      </label>
      <label>
        Album URL
        <input
          name="slug"
          required
          minLength={3}
          maxLength={180}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={slug}
          onChange={(event) => {
            setManualSlug(true);
            setSlug(event.target.value);
          }}
        />
      </label>
      <label>
        About this event
        <textarea
          name="description"
          rows={4}
          maxLength={3000}
          defaultValue={album?.description}
        />
      </label>
      <div className="form-row">
        <label>
          Event date
          <input name="eventDate" type="date" defaultValue={album?.eventDate} />
        </label>
        <label>
          Display order
          <input
            name="displayOrder"
            type="number"
            required
            min={0}
            max={9999}
            defaultValue={album?.displayOrder ?? 0}
          />
        </label>
      </div>
      <div className="check-row">
        <label>
          <input
            name="published"
            type="checkbox"
            defaultChecked={album?.published ?? false}
          />{" "}
          Publish this album on the website
        </label>
      </div>
      <small>
        Lower order numbers appear first. Draft albums and their files are visible only to
        admins.
      </small>
      {result.error && (
        <p role="alert" className="form-error">
          {result.error}
        </p>
      )}
      <div className="form-actions">
        <Link href="/admin/gallery" className="btn btn-outline">
          Back to albums
        </Link>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : album ? "Save album" : "Create folder"}
        </button>
      </div>
    </form>
  );
}

export function DeleteAlbumButton({ id }: { id: number }) {
  const [result, action, pending] = useActionState(deleteAlbum, {});
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm("Permanently delete this album and all its photos and videos?")
        )
          event.preventDefault();
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="btn btn-outline" disabled={pending}>
        {pending ? "Deleting…" : "Delete album"}
      </button>
      {result.error && <p role="alert">{result.error}</p>}
    </form>
  );
}

export function GalleryUploader({ albumId }: { albumId: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = Array.from(input.current?.files || []);
    if (!files.length || busy) return;
    if (files.length > 20) {
      setErrors(["Choose up to 20 files at a time."]);
      return;
    }
    setBusy(true);
    setErrors([]);
    let completed = 0;
    // Upload individually: a failed file does not discard the other files in this album.
    for (const [index, file] of files.entries()) {
      setStatus("Uploading " + (index + 1) + " of " + files.length + ": " + file.name);
      try {
        const isPhoto = file.type.startsWith("image/");
        const limit = isPhoto ? IMAGE_LIMIT : VIDEO_LIMIT;
        if (file.size >= limit)
          throw new Error(isPhoto ? PHOTO_LIMIT_MESSAGE : VIDEO_LIMIT_MESSAGE);
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/gallery/" + albumId + "/media", {
          method: "POST",
          body: form,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed.");
        completed++;
      } catch (error) {
        setErrors((previous) => [
          ...previous,
          file.name + ": " + (error instanceof Error ? error.message : "Upload failed."),
        ]);
      }
    }
    setStatus(completed + " of " + files.length + " files uploaded.");
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <section className="gallery-upload admin-card padded">
      <UploadCloud size={32} />
      <h2>Add photos &amp; videos</h2>
      <p>Select multiple files for this event folder.</p>
      <form onSubmit={upload}>
        <label htmlFor="gallery-files">Choose media</label>
        <input
          id="gallery-files"
          ref={input}
          type="file"
          multiple
          required
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          disabled={busy}
        />
        <small>
          JPG, PNG, WebP: under 1 MB. MP4, WebM: under 15 MB. Up to 20 files per batch.
        </small>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Uploading…" : "Upload to folder"}
        </button>
      </form>
      <p role="status" aria-live="polite">
        {status}
      </p>
      {errors.length > 0 && (
        <ul role="alert" className="form-error">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

type MediaInput = {
  id: number;
  mimeType: string;
  originalName: string;
  caption: string;
  displayOrder: number;
};
export function MediaEditor({ item }: { item: MediaInput }) {
  const [result, action, pending] = useActionState(saveMedia, {});
  const [removed, remove, deleting] = useActionState(deleteMedia, {});
  const source = "/api/gallery/media/" + item.id;
  return (
    <article className="gallery-edit-card">
      {item.mimeType.startsWith("video/") ? (
        <video
          src={source}
          controls
          preload="metadata"
          aria-label={item.caption || item.originalName}
        />
      ) : (
        <img src={source} alt={item.caption || item.originalName} loading="lazy" />
      )}
      <div className="gallery-edit-body">
        <p className="gallery-filename">{item.originalName}</p>
        <form action={action} className="admin-form">
          <input name="id" type="hidden" value={item.id} />
          <label>
            Caption / image description
            <input name="caption" defaultValue={item.caption} maxLength={500} />
          </label>
          <label>
            Display order
            <input
              name="displayOrder"
              type="number"
              min={0}
              max={9999}
              required
              defaultValue={item.displayOrder}
            />
          </label>
          <button className="btn btn-outline" disabled={pending}>
            {pending ? "Saving…" : "Save details"}
          </button>
          <small role="status">{result.error || result.success}</small>
        </form>
        <form
          action={remove}
          onSubmit={(event) => {
            if (!window.confirm("Permanently delete this file?")) event.preventDefault();
          }}
        >
          <input name="id" type="hidden" value={item.id} />
          <button className="gallery-delete" disabled={deleting}>
            {deleting ? "Deleting…" : "Delete file"}
          </button>
          <small role="status">{removed.error}</small>
        </form>
      </div>
    </article>
  );
}
