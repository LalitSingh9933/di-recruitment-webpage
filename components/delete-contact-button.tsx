"use client";
import { useActionState } from "react";
import { deleteContact } from "@/app/admin/contacts/actions";
export function DeleteContactButton({ id }: { id: number }) {
  const [result, action, pending] = useActionState(deleteContact, {});
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !confirm("Permanently delete this contact submission? This cannot be undone.")
        )
          event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-outline" disabled={pending}>
        {pending ? "Deleting…" : "Delete submission"}
      </button>
      {result.error && <p role="alert">{result.error}</p>}
    </form>
  );
}
