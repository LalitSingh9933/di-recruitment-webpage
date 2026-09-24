import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getFeaturedOpportunity } from "@/lib/featured-opportunity";
import { FeaturedOpportunityForm } from "@/components/featured-opportunity-form";

export default async function FeaturedOpportunityAdmin() {
  await requireAdmin();
  const entry = await getFeaturedOpportunity();
  return (
    <div className="admin-content narrow">
      <div className="admin-heading">
        <div>
          <span>Homepage</span>
          <h1>Featured opportunity</h1>
          <p>
            Manage the highlight card beside the homepage introduction. Its button opens
            all jobs. This card is separate from job listings.
          </p>
        </div>
        <Link href="/">View website →</Link>
      </div>
      <FeaturedOpportunityForm key={entry ? "existing" : "new"} entry={entry} />
    </div>
  );
}
