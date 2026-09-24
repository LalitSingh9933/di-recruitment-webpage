"use client";
import { useActionState } from "react";
import { submitContact } from "@/app/contact/actions";

export function ContactForm() {
  const [result, action, pending] = useActionState(submitContact, {});
  if (result.success)
    return (
      <div className="contact-success" role="status">
        <h2>Message received</h2>
        <p>{result.success}</p>
        <a href="/" className="btn btn-primary">
          Back to homepage
        </a>
      </div>
    );
  return (
    <form action={action} className="admin-form public-contact-form">
      <div className="form-row">
        <label>
          Full name
          <input
            name="fullName"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
      </div>
      <label>
        Phone number
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          minLength={7}
          maxLength={30}
        />
      </label>
      <label>
        Subject
        <input name="subject" required minLength={3} maxLength={180} />
      </label>
      <label>
        Message
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} />
      </label>
      <label className="contact-honeypot" aria-hidden="true">
        Leave this blank
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <small>
        Your details will only be visible to our administrators to respond to your
        enquiry.
      </small>
      {result.error && (
        <p className="form-error" role="alert">
          {result.error}
        </p>
      )}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
