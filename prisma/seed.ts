import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const jobs = [
  {
    title: "Hotel Housekeeper",
    slug: "hotel-housekeeper-greece",
    company: "Aegean Hospitality Group",
    country: "Greece",
    city: "Athens",
    category: "Hospitality",
    salary: "€900–€1,150 / month",
    vacancies: 24,
    featured: true,
    description:
      "Join a respected hospitality group supporting premium hotels across Athens.",
    requirements: "1+ year relevant experience; conversational English; valid passport.",
  },
  {
    title: "Construction Worker",
    slug: "construction-worker-romania",
    company: "NordBuild SRL",
    country: "Romania",
    city: "Bucharest",
    category: "Construction",
    salary: "€850–€1,100 / month",
    vacancies: 40,
    featured: true,
    description:
      "General construction roles on long-term residential and commercial projects.",
    requirements: "Physically fit; safety-conscious; prior site experience preferred.",
  },
  {
    title: "Industrial Electrician",
    slug: "industrial-electrician-uae",
    company: "Gulf Technical Services",
    country: "UAE",
    city: "Dubai",
    category: "Engineering",
    salary: "AED 2,800–3,500 / month",
    vacancies: 12,
    featured: true,
    description:
      "Install and maintain electrical systems at modern industrial facilities.",
    requirements:
      "Trade certification; 3+ years experience; ability to read technical plans.",
  },
  {
    title: "Restaurant Server",
    slug: "restaurant-server-cyprus",
    company: "Mediterranean Dining Co.",
    country: "Cyprus",
    city: "Limassol",
    category: "Hospitality",
    salary: "€950–€1,200 / month",
    vacancies: 18,
    featured: false,
    description: "Deliver warm, professional service at a busy coastal restaurant group.",
    requirements: "Good English; guest-first attitude; restaurant experience preferred.",
  },
];

async function main() {
  // Upserts make setup repeatable, but rerunning also refreshes these sample jobs.
  for (const job of jobs)
    await prisma.job.upsert({ where: { slug: job.slug }, update: job, create: job });
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const salt = randomBytes(16).toString("hex");
    const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
    await prisma.admin.upsert({
      where: { email: email.toLowerCase() },
      // Initial credentials must never overwrite an administrator's chosen password.
      update: {},
      create: { email: email.toLowerCase(), name: "D.I. Administrator", passwordHash },
    });
  } else {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD not set; skipped admin creation.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
