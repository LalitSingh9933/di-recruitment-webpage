"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Facebook, RefreshCw } from "lucide-react";

export function FacebookFeed({ pageUrl }: { pageUrl: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    // Facebook measures its plugin only on load. Re-render at the new width after resizing.
    let timer: ReturnType<typeof setTimeout>;
    const measure = () => {
      setWidth(Math.max(180, Math.min(500, Math.floor(element.clientWidth))));
    };
    measure();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 200);
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const parameters = new URLSearchParams({
    href: pageUrl,
    tabs: "timeline",
    width: String(width ?? 500),
    height: "620",
    small_header: "true",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "false",
  });

  return (
    <section className="admin-card dashboard-facebook" aria-labelledby="facebook-heading">
      <div className="card-title">
        <div>
          <h2 id="facebook-heading">Latest from Facebook</h2>
          <p>D.I. Recruitment’s public page updates</p>
        </div>
        <a href={pageUrl} target="_blank" rel="noopener noreferrer">
          Open Facebook <ArrowUpRight size={16} />
        </a>
      </div>

      <div className="facebook-content">
        <div className="facebook-summary">
          <span className="facebook-icon">
            <Facebook size={30} />
          </span>
          <h3>Stay connected with D.I.</h3>
          <p>
            See the latest public posts, announcements, and moments shared by D.I.
            Recruitment on Facebook.
          </p>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => setRevision((value) => value + 1)}
          >
            <RefreshCw size={16} /> Refresh feed
          </button>
          <p className="facebook-help">
            Feed not showing? Facebook may require sign-in or your browser may block
            embedded content.{" "}
            <a href={pageUrl} target="_blank" rel="noopener noreferrer">
              View posts on Facebook.
            </a>
          </p>
        </div>

        <div className="facebook-frame" ref={container}>
          {width !== null && (
            <iframe
              key={revision + "-" + width}
              title="D.I. Recruitment Facebook page timeline"
              src={"https://www.facebook.com/plugins/page.php?" + parameters.toString()}
              width={width}
              height={620}
              loading="lazy"
              referrerPolicy="no-referrer"
              allow="encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </section>
  );
}
