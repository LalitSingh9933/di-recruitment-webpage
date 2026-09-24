import { z } from "zod";
import { prisma } from "@/lib/prisma";

// A single homepage card is stored as structured CMS content, not a job application record.
export const featuredOpportunityKey = "homepage-featured-opportunity";
export const featuredOpportunitySchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(500),
  badge: z.string().trim().min(1).max(8),
  location: z.string().trim().min(2).max(100),
  openings: z.coerce.number().int().min(1).max(100000),
  published: z.boolean(),
});
export type FeaturedOpportunity = z.infer<typeof featuredOpportunitySchema>;
export async function getFeaturedOpportunity() {
  const record = await prisma.contentPage.findUnique({
    where: { slug: featuredOpportunityKey },
  });
  if (!record) return null;
  try {
    const result = featuredOpportunitySchema.safeParse(JSON.parse(record.content));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
