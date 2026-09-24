"use client";

import { useActionState } from "react";
import { updateApplicationStatusAction } from "@/app/admin/actions";

export function ApplicationStatusForm({ id, status }: { id: number; status: string }) {
  const [result, action, pending] = useActionState(async (_: string, data: FormData) => {
    try {
      await updateApplicationStatusAction(data);
      return "Saved";
    } catch {
      return "Could not save. Please retry.";
    }
  }, "");
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <select
        aria-label="Application status"
        name="status"
        defaultValue={status}
        disabled={pending}
      >
        <option value="RECEIVED">Received</option>
        <option value="REVIEWING">Reviewing</option>
        <option value="SHORTLISTED">Shortlisted</option>
        <option value="PLACED">Placed</option>
        <option value="REJECTED">Rejected</option>
      </select>
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      <small role="status">{result}</small>
    </form>
  );
}
