import { Facebook, Linkedin, Youtube, Music2 } from "lucide-react";
import { getSocialLinks } from "@/lib/social-links";


const icons = { Facebook, LinkedIn: Linkedin, YouTube: Youtube, TikTok: Music2 };

export function FooterSocialLinks() {
  return (
    <div className="tw:mt-5">
      <h2 className="tw:mb-3 tw:text-sm tw:font-semibold tw:tracking-wide tw:text-white">
        Connect with us
      </h2>
      <nav aria-label="Social media" className="tw:flex tw:flex-wrap tw:gap-2">
        {getSocialLinks().map(({ name, url }) => {
          const Icon = icons[name as keyof typeof icons];
          const content = (
            <>
              <Icon size={17} aria-hidden="true" />
              <span>{name}</span>
            </>
          );
          return url ? (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} (opens in a new tab)`}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:border-white/25 tw:px-3 tw:py-2 tw:text-xs tw:text-white tw:transition-colors tw:hover:bg-white/15 tw:focus-visible:outline-2 tw:focus-visible:outline-offset-4 tw:focus-visible:outline-amber-300"
            >
              {content}
            </a>
          ) : (
            <span
              key={name}
              aria-disabled="true"
              title={`${name} profile not configured yet`}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:border-white/15 tw:px-3 tw:py-2 tw:text-xs tw:text-slate-400"
            >
              {content}
              <span className="tw:sr-only"> - profile not configured yet</span>
            </span>
          );
        })}
      </nav>
    </div>
  );
}
