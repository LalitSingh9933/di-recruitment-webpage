"use client";
import { useActionState } from "react";
import { saveSlide, deleteSlide } from "@/app/admin/carousel/actions";
import { ContentImageInput } from "@/components/content-image-input";

type Slide = {
  id: number;
  title: string;
  imageUrl: string;
  displayOrder: number;
  published: boolean;
};
export function CarouselForm({ slide }: { slide?: Slide }) {
  const [result, action, pending] = useActionState(saveSlide, {});
  const [deleted, remove, deleting] = useActionState(deleteSlide, {});
  return (
    <section className="admin-card padded document-editor">
      <h2>{slide ? "Edit slide" : "Add carousel image"}</h2>
      {slide && (
        <p role="status">
          {slide.published
            ? "Published — visible on the homepage."
            : "Draft — hidden from the homepage. Tick Show on homepage below and save to publish."}
        </p>
      )}
      <form action={action} className="admin-form">
        {slide && <input type="hidden" name="id" value={slide.id} />}
        <label>
          Image title / description
          <input
            name="title"
            required
            minLength={3}
            maxLength={180}
            defaultValue={slide?.title}
          />
        </label>
        <ContentImageInput
          key={slide?.imageUrl || result.success || "new"}
          current={slide?.imageUrl}
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
            defaultValue={slide?.displayOrder ?? 0}
          />
        </label>
        <label className="check-row">
          <input
            name="published"
            type="checkbox"
            defaultChecked={slide?.published ?? false}
          />{" "}
          Show on homepage
        </label>
        <p role="status">{result.error || result.success}</p>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save slide"}
        </button>
      </form>
      {slide && (
        <form
          action={remove}
          onSubmit={(e) => {
            if (!confirm("Delete this slide and its image permanently?"))
              e.preventDefault();
          }}
        >
          <input name="id" type="hidden" value={slide.id} />
          <button className="btn btn-outline" disabled={deleting}>
            Delete slide
          </button>
          <p role="status">{deleted.error}</p>
        </form>
      )}
    </section>
  );
}
