import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteContactButton } from "@/components/delete-contact-button";

export default async function Contacts({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const raw = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 100000) : 1;
  const [messages, count] = await Promise.all([
    prisma.contactSubmission.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
      skip: (page - 1) * 20,
    }),
    prisma.contactSubmission.count(),
  ]);
  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <span>Website enquiries</span>
          <h1>Contact submissions</h1>
          <p>{count} messages. Newest messages appear first.</p>
        </div>
      </div>
      {!messages.length && (
        <div className="admin-card padded">No contact submissions on this page.</div>
      )}
      {messages.map((message) => (
        <article className="admin-card padded contact-submission" key={message.id}>
          <h2>{message.subject}</h2>
          <p>
            <strong>{message.fullName}</strong> · {message.createdAt.toLocaleString()}
          </p>
          <p>
            <a href={"mailto:" + message.email}>{message.email}</a> · {message.phone}
          </p>
          <p className="contact-message">{message.message}</p>
          <DeleteContactButton id={message.id} />
        </article>
      ))}
      <nav className="form-actions" aria-label="Contact submissions pages">
        {page > 1 && <Link href={"?page=" + (page - 1)}>← Previous</Link>}
        {page * 20 < count && <Link href={"?page=" + (page + 1)}>Next →</Link>}
      </nav>
    </div>
  );
}
