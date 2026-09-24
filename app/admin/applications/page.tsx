import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationStatusForm } from "@/components/application-status-form";

export default async function Applications() {
  await requireAdmin();
  const apps = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: { job: { select: { title: true, country: true } } },
  });
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Candidates</span>
          <h1>Applications</h1>
          <p>Review candidates and move them through the hiring pipeline.</p>
        </div>
      </div>
      <section className="admin-card">
        <div className="admin-table application-table">
          <div className="table-row table-head">
            <span>Candidate</span>
            <span>Applied for</span>
            <span>Contact</span>
            <span>Experience</span>
            <span>Status</span>
          </div>
          {apps.map((a) => (
            <div className="table-row" key={a.id}>
              <span>
                <b>{a.fullName}</b>
                <small>
                  {a.nationality} · {a.createdAt.toLocaleDateString()}
                </small>
              </span>
              <span>
                <b>{a.job.title}</b>
                <small>{a.job.country}</small>
              </span>
              <span>
                <a href={`mailto:${a.email}`}>{a.email}</a>
                <small>{a.phone}</small>
              </span>
              <span>{a.experience == null ? "—" : `${a.experience} years`}</span>
              <span>
                <ApplicationStatusForm id={a.id} status={a.status} />
              </span>
            </div>
          ))}
        </div>
        {apps.length === 0 && (
          <div className="empty">
            Applications will appear here when candidates apply.
          </div>
        )}
      </section>
    </div>
  );
}
