import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteTeamButton } from "@/components/team-form";
export default async function AdminTeam() {
  await requireAdmin();
  const members = await prisma.teamMember.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Website content</span>
          <h1>Team members</h1>
          <p>Manage positions, biographies, and the order your team appears.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/team/new">
          + Add team member
        </Link>
      </div>
      <section className="admin-card">
        <div className="admin-table">
          <div className="table-row table-head">
            <span>Name &amp; position</span>
            <span>Display order</span>
            <span>Visibility</span>
            <span>Actions</span>
          </div>
          {members.map((member) => (
            <div className="table-row" key={member.id}>
              <span>
                <b>{member.name}</b>
                <small>{member.position}</small>
              </span>
              <span>{member.displayOrder}</span>
              <span className={"status " + (member.published ? "placed" : "")}>
                {member.published ? "Visible" : "Hidden"}
              </span>
              <div className="blog-actions">
                <Link className="text-link" href={"/admin/team/" + member.id}>
                  Edit
                </Link>
                <DeleteTeamButton id={member.id} />
              </div>
            </div>
          ))}
        </div>
        {!members.length && (
          <div className="empty">
            No team members yet. Add your first person to get started.
          </div>
        )}
      </section>
      <p>
        <Link className="text-link" href="/team">
          View public Team page →
        </Link>
      </p>
    </div>
  );
}
