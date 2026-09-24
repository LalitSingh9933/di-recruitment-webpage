import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { TeamPhoto } from "@/components/team-photo";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Our Team | D.I. Recruitment",
  description: "Meet the people behind D.I. Recruitment Agency.",
};
export default async function TeamPage() {
  const members = await prisma.teamMember.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, bio: true, photoUrl: true },
  });
  return (
    <>
      <Navbar />
      <main className="section blog-section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">
              <span /> The people behind the possibilities
            </div>
            <h2>
              Meet <em>our team.</em>
            </h2>
            <p className="blog-intro">
              Your ambitions, supported by people who care. Get to know the team at D.I.
              Recruitment.
            </p>
          </div>
          {members.length ? (
            <div className="blog-grid">
              {members.map((member) => (
                <article className="blog-card" key={member.id}>
                  <TeamPhoto name={member.name} photoUrl={member.photoUrl} />
                  <div className="blog-card-body">
                    <span className="team-position">{member.position}</span>
                    <h3>{member.name}</h3>
                    <p className="team-bio">{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <h3>Our team profiles are coming soon.</h3>
              <p>In the meantime, our team is here to help.</p>
              <Link className="text-link" href="/#contact">
                Get in touch →
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
