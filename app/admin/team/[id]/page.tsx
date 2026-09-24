import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamForm } from "@/components/team-form";
export default async function EditTeam({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) notFound();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Team</span>
          <h1>Edit team member</h1>
        </div>
      </div>
      <section className="admin-card padded">
        <TeamForm
          member={{
            id: member.id,
            name: member.name,
            position: member.position,
            bio: member.bio,
            photoUrl: member.photoUrl,
            displayOrder: member.displayOrder,
            published: member.published,
          }}
        />
      </section>
    </div>
  );
}
