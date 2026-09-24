"use client";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from '@/storage/team/logo.png'

const aboutLinks = [
  ["/about/introduction", "Introduction"],
  ["/about/vision-mission-goals", "Our Vision, Mission & Goals"],
  ["/about/chairman-message", "Message from the Chairman"],
  ["/about/managing-director-message", "Message from the Managing Director"],
  ["/team", "Our Team"],
  ["/about/legal-documents", "Legal Documents"],
];
export function Navbar() {
  const [open, setOpen] = useState(false);
  const dropdown = useRef<HTMLDetailsElement>(null);
  function close() {
    setOpen(false);
    if (dropdown.current) dropdown.current.open = false;
  }
  useEffect(() => {
    // Dismiss the About dropdown when focus moves to a different pointer target.
    const outside = (event: PointerEvent) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node))
        dropdown.current.open = false;
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>Licensed by the Government of Nepal</span>
          <a href="tel:9851400933">
            <Phone size={13} /> +977 985-1400933
          </a>
        </div>
      </div>
      <header className="site-header">
        <div className="container nav">
          <Link className="brand" href="/" onClick={close}>
            <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
              <Image
                src={logo}
                alt="Company logo"
                className="object-contain"
                height={70}
              />
            </div>
            <span>
              <b>D.I. Recruitment</b>
              <small>Agency Pvt. Ltd.</small>
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            id="main-navigation"
            className={open ? "open" : ""}
          >
            <Link href="/" onClick={close}>
              Home
            </Link>
            <details
              className="about-dropdown"
              ref={dropdown}
              onKeyDown={(e) => {
                if (e.key === "Escape" && dropdown.current) {
                  dropdown.current.open = false;
                  dropdown.current.querySelector("summary")?.focus();
                }
              }}
            >
              <summary>
                About <ChevronDown size={14} />
              </summary>
              <div className="about-menu">
                {aboutLinks.map(([href, label]) => (
                  <Link href={href} onClick={close} key={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/jobs" onClick={close}>
              Jobs
            </Link>
            <Link href="/#services" onClick={close}>
              Services
            </Link>
            <Link href="/#employers" onClick={close}>
              For employers
            </Link>
            <Link href="/blog" onClick={close}>
              Blog
            </Link>
            <Link href="/gallery" onClick={close}>
              Gallery
            </Link>
            <Link href="/contact" onClick={close}>
              Contact
            </Link>
            <Link className="nav-cta" href="/jobs" onClick={close}>
              Find a job
            </Link>
          </nav>
          <button
            className="menu"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
