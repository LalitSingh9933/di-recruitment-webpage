"use client";

import { useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";

type Item = { id: number; mimeType: string; caption: string; originalName: string };
export function GalleryMedia({ media }: { media: Item[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [filter, setFilter] = useState("all");
  const visible = media.filter(
    (item) => filter === "all" || item.mimeType.startsWith(filter + "/"),
  );

  // Native dialog manages focus containment, Escape dismissal, and focus restoration.
  function openPhoto(item: Item) {
    setSelected(item);
    dialog.current?.showModal();
  }
  return (
    <>
      <div className="gallery-filters" aria-label="Filter album media">
        {[
          ["all", "All media"],
          ["image", "Photos"],
          ["video", "Videos"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="gallery-public-media">
        {visible.map((item) => (
          <figure key={item.id} className="gallery-item">
            {item.mimeType.startsWith("video/") ? (
              <video
                src={"/api/gallery/media/" + item.id}
                controls
                playsInline
                preload="metadata"
                aria-label={item.caption || item.originalName}
              />
            ) : (
              <button
                className="gallery-photo-button"
                aria-label={"Enlarge " + (item.caption || item.originalName)}
                onClick={() => openPhoto(item)}
              >
                <img
                  src={"/api/gallery/media/" + item.id}
                  alt={item.caption || item.originalName}
                  loading="lazy"
                />
                <ZoomIn size={20} />
              </button>
            )}
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {!visible.length && (
        <div className="blog-empty">
          No {filter === "video" ? "videos" : filter === "image" ? "photos" : "media"} in
          this album yet.
        </div>
      )}
      <dialog
        className="gallery-lightbox"
        ref={dialog}
        aria-label="Photo preview"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <button
          className="gallery-lightbox-close"
          onClick={() => dialog.current?.close()}
          aria-label="Close photo"
        >
          <X />
        </button>
        {selected && (
          <figure>
            <img
              src={"/api/gallery/media/" + selected.id}
              alt={selected.caption || selected.originalName}
            />
            <figcaption>{selected.caption}</figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
