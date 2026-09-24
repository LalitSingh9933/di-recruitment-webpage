import { getFacebookPageUrl } from "@/lib/facebook";

// Reject untrusted protocols/hosts rather than emitting unsafe footer links.
export function validateSocialUrl(value: string | undefined, domain: string) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    if (url.hostname !== domain && !url.hostname.endsWith("." + domain)) return null;
    if (url.pathname === "/") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getSocialLinks() {
  return [
    { name: "Facebook", url: getFacebookPageUrl() },
    {
      name: "LinkedIn",
      url: validateSocialUrl(process.env.LINKEDIN_URL, "linkedin.com"),
    },
    { name: "YouTube", url: validateSocialUrl(process.env.YOUTUBE_URL, "youtube.com") },
    { name: "TikTok", url: validateSocialUrl(process.env.TIKTOK_URL, "tiktok.com") },
  ];
}
