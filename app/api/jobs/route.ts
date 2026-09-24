import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const country = searchParams.get("country") || undefined;
  const jobs = await prisma.job.findMany({
    where: {
      active: true,
      ...(country ? { country } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { company: { contains: q } },
              { category: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(jobs);
}
