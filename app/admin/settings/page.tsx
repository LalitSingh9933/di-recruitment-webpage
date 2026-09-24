import { requireAdmin } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function SettingsPage() {
  const session = await requireAdmin();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Account settings</span>
          <h1>Change password</h1>
          <p>Manage the password for {session.email}.</p>
        </div>
      </div>
      <section className="admin-card padded">
        <h2>Keep your account secure</h2>
        <p>
          Enter your current password to choose a new one. Other signed-in sessions will
          be disconnected.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
