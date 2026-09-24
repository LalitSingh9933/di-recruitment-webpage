import Link from "next/link";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteJobAction } from "../actions";

export default async function JobsAdmin() {
  await requireAdmin();
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Content</span>
          <h1>Job opportunities</h1>
          <p>Create, update, publish, or remove vacancies.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/jobs/new">
          <Plus size={18} /> Add job
        </Link>
      </div>
      <section className="admin-card">
        <div className="admin-table jobs-table">
          <div className="table-row table-head">
            <span>Position</span>
            <span>Location</span>
            <span>Applications</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {jobs.map((j) => (
            <div className="table-row" key={j.id}>
              <span>
                <b>{j.title}</b>
                <small>{j.company}</small>
              </span>
              <span>
                {j.city}, {j.country}
              </span>
              <span>{j._count.applications}</span>
              <span>
                <i className={`status ${j.active ? "placed" : "rejected"}`}>
                  {j.active ? "Published" : "Draft"}
                </i>
              </span>
              <span className="table-actions">
                <Link href={`/admin/jobs/${j.id}`} aria-label="Edit job">
                  <Edit3 />
                </Link>
                <form action={deleteJobAction}>
                  <input type="hidden" name="id" value={j.id} />
                  <button aria-label="Delete job">
                    <Trash2 />
                  </button>
                </form>
              </span>
            </div>
          ))}
        </div>
        {jobs.length === 0 && (
          <div className="empty">No jobs yet. Create your first opportunity.</div>
        )}
      </section>
    </div>
  );
}
