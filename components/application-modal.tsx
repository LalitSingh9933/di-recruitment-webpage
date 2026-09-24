"use client";
import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import type { JobCard } from "@/lib/jobs";

export function ApplicationModal({
  job,
  onClose,
}: {
  job: JobCard;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd);
    try {
      const r = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, jobId: job.id }),
      });
      if (!r.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        {status === "success" ? (
          <div className="success">
            <CheckCircle2 />
            <h3>Application received!</h3>
            <p>
              Thanks for applying for <b>{job.title}</b>. Our team will review your
              details and contact you shortly.
            </p>
            <button className="btn btn-dark" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="modal-kicker">Apply now</span>
            <h3>{job.title}</h3>
            <p>
              {job.company} · {job.city}, {job.country}
            </p>
            <form onSubmit={submit}>
              <div className="form-row">
                <label>
                  Full name
                  <input name="fullName" required placeholder="Your full name" />
                </label>
                <label>
                  Phone
                  <input name="phone" required placeholder="+977 98..." />
                </label>
              </div>
              <label>
                Email address
                <input name="email" type="email" required placeholder="you@example.com" />
              </label>
              <div className="form-row">
                <label>
                  Experience (years)
                  <input name="experience" type="number" min="0" placeholder="2" />
                </label>
                <label>
                  Nationality
                  <input name="nationality" defaultValue="Nepalese" />
                </label>
              </div>
              <label>
                Tell us briefly about yourself
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Your experience and availability..."
                />
              </label>
              {status === "error" && (
                <p className="form-error">
                  Could not submit. The job may have closed or you may have sent too many
                  applications. Please try again later.
                </p>
              )}
              <button
                className="btn btn-primary form-submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="spin" /> Submitting…
                  </>
                ) : (
                  "Submit application"
                )}
              </button>
              <small>
                By submitting, you agree to be contacted about this opportunity.
              </small>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
