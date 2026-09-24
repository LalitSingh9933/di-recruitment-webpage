import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="login-page">
      <div className="login-panel">
        <div className="brand">
          <span className="brand-mark">DI</span>
          <span>
            <b>D.I. Recruitment</b>
            <small>Administration</small>
          </span>
        </div>
        <div>
          <span className="modal-kicker">Protected area</span>
          <h1>Welcome back.</h1>
          <p>Sign in to manage opportunities and candidate applications.</p>
        </div>
        <LoginForm />
        <a href="/">← Return to website</a>
      </div>
      <div className="login-visual">
        <div>
          <span>Recruitment, organized.</span>
          <h2>Manage every opportunity from one focused workspace.</h2>
        </div>
      </div>
    </main>
  );
}
