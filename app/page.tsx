import Image from "next/image";
import Link from "next/link";
import logo from '@/storage/team/logo.png'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Globe2,
  GraduationCap,
  Headphones,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { JobExplorer } from "@/components/job-explorer";
import { BlogList } from "@/components/blog-list";
import { Navbar } from "@/components/navbar";
import { FacebookFeed } from "@/components/facebook-feed";
import { getFacebookPageUrl } from "@/lib/facebook";
import type { JobCard } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { FooterSocialLinks } from "@/components/footer-social-links";
import { getFeaturedOpportunity } from "@/lib/featured-opportunity";
import { HeroCarousel } from "@/components/hero-carousel";
import { Testimonials } from "@/components/testimonials";

const services = [
  {
    icon: BriefcaseBusiness,
    n: "01",
    title: "Global placement",
    text: "Verified opportunities with reputable employers across Europe, the Gulf, and beyond.",
  },
  {
    icon: GraduationCap,
    n: "02",
    title: "Skills & language",
    text: "Practical training that prepares candidates to work confidently from day one.",
  },
  {
    icon: ShieldCheck,
    n: "03",
    title: "Visa & documentation",
    text: "Clear, compliant guidance through every document, interview, and approval.",
  },
  {
    icon: Headphones,
    n: "04",
    title: "End-to-end support",
    text: "Real people supporting workers and employers before and after placement.",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const featuredOpportunity = await getFeaturedOpportunity();
  const slides = await prisma.carouselSlide.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
    select: { id: true, title: true, imageUrl: true },
  });
  // Published vacancies come from MySQL; no placeholder records are presented as live jobs.
  let jobs: JobCard[] = [];
  try {
    const records = await prisma.job.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    if (records.length)
      jobs = records.map((job) => ({
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
        posted: job.createdAt.toLocaleDateString("en", {
          month: "short",
          day: "numeric",
        }),
      }));
  } catch (error) {
    console.error("Could not load published jobs", error);
  }
  return (
    <main>
      <Navbar />
      <section className="hero" id="home">
        <HeroCarousel slides={slides} />
        <div className="hero-wash" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow light">
              <span />
              <Globe2 size={16} /> Nepal’s trusted global recruitment partner
            </div>
            <h1>
              Talent that travels.
              <br />
              <em>Futures that rise.</em>
            </h1>
            <p>
              We connect hardworking Nepalese professionals with verified international
              opportunities—ethically, transparently, and with care at every step.
            </p>
            <div className="hero-actions">
              <Link href="#jobs" className="btn btn-primary">
                Explore open jobs <ArrowRight size={18} />
              </Link>
              <Link href="#employers" className="btn btn-ghost">
                Hire from Nepal
              </Link>
            </div>
            <div className="trust-row">
              <span>
                <CheckCircle2 /> Government licensed
              </span>
              <span>
                <CheckCircle2 /> Ethical recruitment
              </span>
              <span>
                <CheckCircle2 /> Global network
              </span>
            </div>
          </div>
          {featuredOpportunity?.published && (
            <div className="hero-card">
              <div className="mini-label">
                <Sparkles size={15} /> Featured opportunity
              </div>
              <div className="flag">{featuredOpportunity.badge}</div>
              <h3>{featuredOpportunity.title}</h3>
              <p>{featuredOpportunity.description}</p>
              <div className="hero-card-meta">
                <span>
                  <MapPin size={15} /> {featuredOpportunity.location}
                </span>
                <span>
                  <UsersRound size={15} /> {featuredOpportunity.openings} openings
                </span>
              </div>
              <Link href="/jobs">
                View opportunities <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
        <div className="hero-stats container">
          <div>
            <strong>15+</strong>
            <span>destination countries</span>
          </div>
          <div>
            <strong>2,500+</strong>
            <span>workers placed</span>
          </div>
          <div>
            <strong>98%</strong>
            <span>visa success rate</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>candidate support</span>
          </div>
        </div>
      </section>

      <section className="section jobs-section" id="jobs">
        <div className="container">
          <div className="section-heading split">
            <div>
              <div className="eyebrow">
                <span /> Live opportunities
              </div>
              <h2>
                Your next chapter
                <br />
                starts <em>somewhere new.</em>
              </h2>
            </div>
            <p>
              Browse verified roles from trusted international employers. Every listing is
              reviewed by our recruitment team.
            </p>
          </div>
          <JobExplorer jobs={jobs} limit={4} />
        </div>
      </section>

      <section className="section story" id="about">
        <div className="container story-grid">
          <div className="story-images">
            <div className="image-main">
              <Image
                src="/images/recruitment-hero.png"
                alt="Recruitment professionals collaborating"
                fill
                sizes="(max-width: 800px) 100vw, 50vw"
              />
            </div>
            <div className="experience">
              <strong>10+</strong>
              <span>
                years of
                <br />
                experience
              </span>
            </div>
            <div className="image-small">
              <Image
                src="/images/recruitment-hero.png"
                alt="Global recruitment team"
                fill
                sizes="300px"
              />
            </div>
          </div>
          <div className="story-copy">
            <div className="eyebrow">
              <span /> Who we are
            </div>
            <h2>
              Recruitment built on
              <br />
              <em>trust, not transactions.</em>
            </h2>
            <p>
              D.I. Recruitment Agency is a Kathmandu-based manpower partner helping
              Nepalese talent build sustainable careers overseas. We work with employers
              who share our belief that recruitment should be fair, transparent, and
              human.
            </p>
            <div className="values">
              <div>
                <BadgeCheck />
                <span>
                  <b>Candidate-first</b>Guidance with dignity and clarity.
                </span>
              </div>
              <div>
                <Building2 />
                <span>
                  <b>Employer-ready</b>Skilled, screened, prepared talent.
                </span>
              </div>
              <div>
                <Globe2 />
                <span>
                  <b>Globally connected</b>Partners across high-growth markets.
                </span>
              </div>
            </div>
            <Link href="/about/introduction" className="text-link">
              Discover our story <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section services" id="services">
        <div className="container">
          <div className="section-heading centered">
            <div className="eyebrow">
              <span /> What we do
            </div>
            <h2>
              From ambition to <em>arrival.</em>
            </h2>
            <p>
              A complete recruitment journey designed around people, compliance, and
              lasting success.
            </p>
          </div>
          <div className="service-grid">
            {services.map(({ icon: Icon, n, title, text }) => (
              <article className="service-card" key={n}>
                <div className="service-top">
                  <Icon />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <ArrowRight className="service-arrow" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="employer" id="employers">
        <div className="container employer-grid">
          <div>
            <div className="eyebrow light">
              <span /> For global employers
            </div>
            <h2>
              The right people.
              <br />
              <em>Ready to perform.</em>
            </h2>
            <p>
              Build dependable teams with skilled, resilient Nepalese talent. We manage
              sourcing, screening, compliance, training, and deployment.
            </p>
            <Link href="/contact" className="btn btn-primary">
              Start hiring <ArrowRight size={18} />
            </Link>
          </div>
          <div className="employer-points">
            <div>
              <span>01</span>
              <p>
                <b>Tell us what you need</b>Share roles, skills, and timelines with our
                team.
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <b>Meet qualified candidates</b>Interview a carefully screened shortlist.
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <b>Deploy with confidence</b>We handle compliance, training, and travel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="section blog-section" id="blog">
        <div className="container">
          <div className="section-heading split">
            <div>
              <div className="eyebrow">
                <span /> From our journal
              </div>
              <h2>
                Ideas for your <em>next chapter.</em>
              </h2>
            </div>
            <Link href="/blog" className="text-link">
              View all articles <ArrowRight size={17} />
            </Link>
          </div>
          <BlogList limit={3} />
        </div>
      </section>

      {/* The public feed uses the same Facebook Page as the admin overview. */}
      <div className="section homepage-facebook" id="facebook">
        <div className="container">
          <FacebookFeed pageUrl={getFacebookPageUrl()} />
        </div>
      </div>

      <section className="contact" id="contact">
        <div className="container contact-grid">
          <div>
            <div className="eyebrow">
              <span /> Let’s connect
            </div>
            <h2>
              A better future
              <br />
              starts with a <em>conversation.</em>
            </h2>
            <p>
              Whether you’re looking for the right role or the right people, our team is
              ready to help.
            </p>
            <Link href="/contact" className="btn btn-primary">
              Send us a message <ArrowRight size={18} />
            </Link>
          </div>
          <div className="contact-card">
            <div>
              <span>Call us</span>
              <a href="tel:9851400933">+977 985-1400933</a>
            </div>
            <div>
              <span>Email</span>
              <a href="mailto:info@direcruitmentagency.com">
                info@direcruitmentagency.com
              </a>
            </div>
            <div>
              <span>Visit</span>
              <p>
                Maharajgunj-03, Amrit Bhawan, 3rd floor
                <br />
                Kathmandu, Nepal
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div>
            <div className="brand brand-light">
              <div>
                <Image
                  src={logo}
                  alt="Company logo"
                  className="object-contain"
                  height={80}
                />
              </div>
              <span>
                <b>D.I. Recruitment</b>
                <small>Agency Pvt. Ltd.</small>
              </span>
            </div>
            <p>
              Creating global opportunities.
              <br />
              Building brighter futures.
            </p>
            <FooterSocialLinks />
          </div>
          <div>
            <b>Explore</b>
            <Link href="/about/introduction">About us</Link>
            <Link href="#jobs">Open jobs</Link>
            <Link href="#services">Services</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/gallery">Event gallery</Link>
            <Link href="/team">Our team</Link>
          </div>
          <div>
            <b>For partners</b>
            <a href="#employers">Hire talent</a>
            <Link href="/contact">Contact</Link>
            <a href="/about/legal-documents">Legal documents</a>
          </div>
          <div>
            <b>License</b>
            <p>
              Government of Nepal
              <br />
              Licensed recruitment agency
            </p>
          </div>
        </div>
        <div className="footer-bottom container">
          <span>© {new Date().getFullYear()} D.I. Recruitment Agency Pvt. Ltd.</span>
          <span>Integrity · Opportunity · Care</span>
        </div>
      </footer>
    </main>
  );
}
