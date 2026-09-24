import { Navbar } from "@/components/navbar";
import { BlogList } from "@/components/blog-list";
export const dynamic = "force-dynamic";
export const metadata = { title: "Blog | D.I. Recruitment" };
export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="section blog-section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">
              <span /> The D.I. journal
            </div>
            <h2>
              Stories, insights &amp; <em>new beginnings.</em>
            </h2>
            <p className="blog-intro">
              News from our team and ideas for your next career chapter.
            </p>
          </div>
          <BlogList />
        </div>
      </main>
    </>
  );
}
