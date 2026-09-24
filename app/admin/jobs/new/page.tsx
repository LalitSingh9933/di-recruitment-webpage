import { requireAdmin } from "@/lib/auth";
import { JobForm } from "@/components/job-form";
export default async function NewJob() {
  await requireAdmin();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Jobs</span>
          <h1>Create opportunity</h1>
          <p>Add a verified vacancy to the public website.</p>
        </div>
      </div>
      <section className="admin-card padded">
        <JobForm />
      </section>
    </div>
  );
}
