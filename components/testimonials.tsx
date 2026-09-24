import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { prisma } from "@/lib/prisma";
export async function Testimonials() {
  const entries = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });
  // Do not present invented placeholder endorsements as genuine client feedback.
  if (!entries.length) return null;
  return (
    <section className="section testimonials-section" id="testimonials">
      <div className="container">
        <div className="section-heading">
          <div className="eyebrow">
            <span /> People & possibilities
          </div>
          <h2>
            Real stories.
            <br />
            <em>New beginnings.</em>
          </h2>
          <p>Hear from the people who have shared their journey with us.</p>
        </div>
        <TestimonialCarousel
          entries={entries.map(({ id, name, position, quote }) => ({
            id,
            name,
            position,
            quote,
          }))}
        />
      </div>
    </section>
  );
}
