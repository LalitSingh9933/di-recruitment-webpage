import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CarouselForm } from "@/components/carousel-form";

export default async function CarouselAdmin() {
  await requireAdmin();
  const slides = await prisma.carouselSlide.findMany({
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Homepage</span>
          <h1>Image carousel</h1>
          <p>
            Add multiple images, edit their order, or hide them. Each image must be under
            1 MB. Wide landscape images work best.
          </p>
        </div>
        <Link href="/">View website →</Link>
      </div>
      <CarouselForm />
      {slides.map(({ updatedAt, ...slide }) => (
        <CarouselForm key={slide.id} slide={slide} />
      ))}
    </div>
  );
}
