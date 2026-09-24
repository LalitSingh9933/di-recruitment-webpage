"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

type Entry = { id: number; name: string; position: string; quote: string };

export function TestimonialCarousel({ entries }: { entries: Entry[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = entries.length;
  const current = count ? index % count : 0;

  useEffect(() => {
    if (count < 2 || paused) return;
    // Restart the five-second interval after manual navigation; clean up on unmount.
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((previous) => (previous + 1) % count);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [count, paused, index]);

  if (!count) return null;
  return (
    <div
      className="testimonial-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
    >
      <div className="testimonial-viewport" aria-live={paused ? "polite" : "off"}>
        <div
          className="testimonial-track"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {entries.map((entry, slideIndex) => (
            <div
              className="testimonial-slide"
              key={entry.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${count}`}
              aria-hidden={slideIndex !== current}
            >
              <figure className="testimonial-card">
                <Quote className="testimonial-quote-icon" size={34} aria-hidden="true" />
                <blockquote>{entry.quote}</blockquote>
                <figcaption>
                  <span className="testimonial-initials" aria-hidden="true">
                    {entry.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")}
                  </span>
                  <span>
                    <strong>{entry.name}</strong>
                    <small>{entry.position}</small>
                  </span>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
      {count > 1 && (
        <div className="testimonial-controls">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => setIndex((current + count - 1) % count)}
          >
            ←
          </button>
          <span>
            {current + 1} / {count}
          </span>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => setIndex((current + 1) % count)}
          >
            →
          </button>
          <button type="button" onClick={() => setPaused(!paused)}>
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      )}
    </div>
  );
}
