"use client";
import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    loginAction,
    {},
  );
  return (
    <form action={action} className="login-form">
      <label>
        Email
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>
        <LockKeyhole size={17} />
        {pending ? "Signing in…" : "Secure sign in"}
      </button>
    </form>
  );
}
