import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileUser,
} from "lucide-react";
import Link from "next/link";
import { FacebookFeed } from "@/components/facebook-feed";
import { getFacebookPageUrl } from "@/lib/facebook";

export default async function Dashboard() {
  await requireAdmin();
  const [jobs, applications, placed, recent] = await Promise.all([
    prisma.job.count({ where: { active: true } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: "PLACED" } }),
    prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { job: { select: { title: true } } },
    }),
  ]);
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Overview</span>
          <h1>Good to see you.</h1>
          <p>Here’s what’s happening across recruitment.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/jobs/new">
          + Add new job
        </Link>
      </div>
      <div className="metric-grid">
        <div>
          <span>
            <BriefcaseBusiness />
          </span>
          <p>Active jobs</p>
          <strong>{jobs}</strong>
          <small>Published opportunities</small>
        </div>
        <div>
          <span>
            <FileUser />
          </span>
          <p>Total applications</p>
          <strong>{applications}</strong>
          <small>Across all job posts</small>
        </div>
        <div>
          <span>
            <Clock3 />
          </span>
          <p>Awaiting review</p>
          <strong>
            {await prisma.application.count({ where: { status: "RECEIVED" } })}
          </strong>
          <small>Needs your attention</small>
        </div>
        <div>
          <span>
            <CheckCircle2 />
          </span>
          <p>Successful placements</p>
          <strong>{placed}</strong>
          <small>Candidates placed</small>
        </div>
      </div>
      <section className="admin-card">
        <div className="card-title">
          <div>
            <h2>Recent applications</h2>
            <p>Latest candidate activity</p>
          </div>
          <Link href="/admin/applications">
            View all <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="admin-table">
          <div className="table-row table-head">
            <span>Candidate</span>
            <span>Position</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {recent.map((a) => (
            <div className="table-row" key={a.id}>
              <span>
                <b>{a.fullName}</b>
                <small>{a.email}</small>
              </span>
              <span>{a.job.title}</span>
              <span>
                <i className={`status ${a.status.toLowerCase()}`}>
                  {a.status.toLowerCase()}
                </i>
              </span>
              <span>{a.createdAt.toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>
      <FacebookFeed pageUrl={getFacebookPageUrl()} />
    </div>
  );
}
