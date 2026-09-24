import { requireAdmin } from "@/lib/auth";
import { TeamForm } from "@/components/team-form";
export default async function NewTeam() {
  await requireAdmin();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Team</span>
          <h1>Add team member</h1>
        </div>
      </div>
      <section className="admin-card padded">
        <TeamForm />
      </section>
    </div>
  );
}
