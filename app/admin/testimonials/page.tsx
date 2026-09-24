import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TestimonialForm } from "@/components/testimonial-form";
export default async function TestimonialAdmin() {
  await requireAdmin();
  const entries = await prisma.testimonial.findMany({
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Client stories</span>
          <h1>Testimonials</h1>
          <p>
            Add genuine feedback with the person’s permission. Only published testimonials
            appear on the website.
          </p>
        </div>
      </div>
      <TestimonialForm />
      {entries.map(({ updatedAt, ...entry }) => (
        <TestimonialForm key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
