import { Navbar } from "@/components/navbar";
import { JobExplorer } from "@/components/job-explorer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "All jobs | D.I. Recruitment",
  description: "Browse published vacancies and apply for your next opportunity.",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string }>;
}) {
  const filters = await searchParams;
  const records = await prisma.job.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  const jobs = records.map((job) => ({
    id: job.id,
    imageUrl: job.imageUrl,
    title: job.title,
    company: job.company,
    country: job.country,
    city: job.city || "",
    category: job.category,
    type: job.type,
    salary: job.salary || "Competitive",
    vacancies: job.vacancies,
    posted: job.createdAt.toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));
  return (
    <>
      <Navbar />
      <main className="section jobs-section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Your next chapter</div>
            <h1>All job opportunities</h1>
            <p>Browse all published jobs, filter by location, and apply directly.</p>
          </div>
          <JobExplorer
            jobs={jobs}
            initialQuery={typeof filters.q === "string" ? filters.q : ""}
            initialCountry={
              typeof filters.country === "string" &&
              jobs.some((job) => job.country === filters.country)
                ? filters.country
                : "All locations"
            }
          />
        </div>
      </main>
    </>
  );
}
