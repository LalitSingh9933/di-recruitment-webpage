"use client";
import { useEffect, useState } from "react";

export function HeroCarousel({
  slides,
}: {
  slides: { id: number; title: string; imageUrl: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const items = slides.length
    ? slides
    : [
        {
          id: 0,
          title: "A diverse professional team collaborating",
          imageUrl: "/images/recruitment-hero.png",
        },
      ];
  const current = index % items.length;
  useEffect(() => {
    if (paused || items.length < 2) return;
    // Clean up on pause/unmount; manual navigation starts a fresh five-second interval.
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((previous) => (previous + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, items.length, index]);
  return (
    <>
      <div
        className="hero-bg"
        role="region"
        aria-roledescription="carousel"
        aria-label="Recruitment images"
      >
        <img
          src={items[current].imageUrl}
          alt={items[current].title}
          className="hero-carousel-image"
          fetchPriority="high"
        />
      </div>
      {items.length > 1 && (
        <div className="hero-carousel-controls">
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => setIndex((current + items.length - 1) % items.length)}
          >
            ←
          </button>
          <span aria-live={paused ? "polite" : "off"}>
            {current + 1} / {items.length}
          </span>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => setIndex((current + 1) % items.length)}
          >
            →
          </button>
          <button
            type="button"
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? "▶" : "Ⅱ"}
          </button>
        </div>
      )}
    </>
  );
}
