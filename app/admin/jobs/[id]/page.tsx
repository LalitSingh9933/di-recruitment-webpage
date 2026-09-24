import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobForm } from "@/components/job-form";
export default async function EditJob({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id: Number(id) } });
  if (!job) notFound();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Jobs</span>
          <h1>Edit opportunity</h1>
          <p>Update the listing and publication status.</p>
        </div>
      </div>
      <section className="admin-card padded">
        <JobForm job={job} />
      </section>
    </div>
  );
}
