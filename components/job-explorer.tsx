"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Briefcase, Clock3, MapPin, Search, Users } from "lucide-react";
import type { JobCard } from "@/lib/jobs";
import { ApplicationModal } from "./application-modal";

export function JobExplorer({
  jobs,
  limit,
  initialQuery = "",
  initialCountry = "All locations",
}: {
  jobs: JobCard[];
  limit?: number;
  initialQuery?: string;
  initialCountry?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);
  const [selected, setSelected] = useState<JobCard | null>(null);
  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (country === "All locations" || j.country === country) &&
          `${j.title} ${j.category} ${j.company}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [jobs, query, country],
  );
  // Filter the full published list before limiting the homepage preview.
  const visible = limit === undefined ? filtered : filtered.slice(0, limit);
  const search = new URLSearchParams();
  if (query) search.set("q", query);
  if (country !== "All locations") search.set("country", country);
  const allJobsHref = "/jobs" + (search.size ? "?" + search.toString() : "");
  return (
    <>
      <div className="job-search">
        <label>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, skill, or company"
          />
        </label>
        <label>
          <MapPin />
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option>All locations</option>
            {[...new Set(jobs.map((j) => j.country))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-dark">Search jobs</button>
      </div>
      <div className="job-grid">
        {visible.map((job) => (
          <article className="job-card" key={job.id}>
            {job.imageUrl && (
              <a
                href={job.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={"View image for " + job.title}
              >
                <img
                  className="job-cover"
                  src={job.imageUrl}
                  alt={job.title}
                  loading="lazy"
                />
              </a>
            )}
            <div className="job-card-head">
              <span className="job-icon">
                <Briefcase />
              </span>
              <span className="posted">
                <Clock3 /> {job.posted}
              </span>
            </div>
            <div className="job-tags">
              <span>{job.category}</span>
              <span>{job.type}</span>
            </div>
            <h3>{job.title}</h3>
            <p className="company">{job.company}</p>
            <div className="job-meta">
              <span>
                <MapPin /> {job.city}, {job.country}
              </span>
              <span>
                <Users /> {job.vacancies} openings
              </span>
            </div>
            <div className="job-bottom">
              <b>{job.salary}</b>
              <button
                onClick={() => setSelected(job)}
                aria-label={`Apply for ${job.title}`}
              >
                <ArrowUpRight />
              </button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty">No roles match those filters. Try a broader search.</div>
      )}
      <div className="all-jobs">
        Showing {visible.length} of {filtered.length} matching opportunities
      </div>
      {limit !== undefined && jobs.length > limit && (
        <div className="all-jobs">
          <Link href={allJobsHref} className="btn btn-primary">
            See more jobs <ArrowUpRight size={18} />
          </Link>
        </div>
      )}
      {selected && <ApplicationModal job={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
