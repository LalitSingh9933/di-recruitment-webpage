"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { changePassword } from "@/app/admin/settings/actions";

export function ChangePasswordForm() {
  const [result, action, pending] = useActionState(changePassword, {});
  const [visible, setVisible] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result.success) {
      form.current?.reset();
      setVisible(false);
    }
  }, [result]);

  return (
    <form ref={form} action={action} className="admin-form">
      <label>
        Current password
        <input
          name="currentPassword"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <label>
        New password
        <input
          name="newPassword"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-describedby="password-guidance"
        />
      </label>
      <small id="password-guidance">
        Use 12–128 characters. A long, unique passphrase is a good choice.
      </small>
      <label>
        Confirm new password
        <input
          name="confirmPassword"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      <button
        className="password-visibility"
        type="button"
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
        {visible ? "Hide passwords" : "Show passwords"}
      </button>
      {result.error && (
        <p className="form-error" role="alert">
          {result.error}
        </p>
      )}
      {result.success && (
        <p className="form-success" role="status">
          {result.success}
        </p>
      )}
      <button className="btn btn-primary" disabled={pending}>
        <LockKeyhole size={18} />
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
