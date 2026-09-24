"use client";
import { useEffect, useState } from "react";
import { IMAGE_LIMIT, PHOTO_LIMIT_MESSAGE } from "@/lib/upload-limits";

export function ContentImageInput({
  current,
  required = false,
}: {
  current?: string | null;
  required?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const existingImage = current?.startsWith("/api/content/images/");
  return (
    <div className="content-image-input">
      <label>
        Image upload
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          required={required && !current}
          onChange={(event) => {
            const selected = event.target.files?.[0] || null;
            if (selected && selected.size >= IMAGE_LIMIT) {
              setError(PHOTO_LIMIT_MESSAGE);
              event.target.value = "";
              setFile(null);
              return;
            }
            setError("");
            setRemoved(false);
            setFile(selected);
          }}
        />
      </label>
      <small>
        JPG, PNG, or WebP. Must be under 1 MB. Choose a new image to replace the current
        one.
      </small>
      {(preview || (existingImage && !removed)) && (
        <img
          className="content-image-preview"
          src={preview || current!}
          alt="Selected image preview"
        />
      )}
      {current && !existingImage && (
        <a href={current} target="_blank" rel="noopener noreferrer">
          View existing document (upload an image to replace it)
        </a>
      )}
      {current && !required && !file && (
        <label className="check-row">
          <input
            type="checkbox"
            name="removeImage"
            checked={removed}
            onChange={(e) => setRemoved(e.target.checked)}
          />{" "}
          Remove current image
        </label>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
