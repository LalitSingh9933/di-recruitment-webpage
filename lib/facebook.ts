// Public Page linked from D.I. Recruitment's reference website.
const DEFAULT_PAGE_URL = "https://www.facebook.com/profile.php?id=61574329241577";

export function getFacebookPageUrl() {
  const configured = process.env.FACEBOOK_PAGE_URL?.trim();
  if (!configured) return DEFAULT_PAGE_URL;

  try {
    const page = new URL(configured);
    const allowedHosts = ["facebook.com", "www.facebook.com", "m.facebook.com"];

    // Restrict the configurable destination to Facebook; never accept arbitrary embeds.
    if (
      page.protocol !== "https:" ||
      !allowedHosts.includes(page.hostname) ||
      page.username ||
      page.password ||
      page.port ||
      page.pathname === "/"
    ) {
      return DEFAULT_PAGE_URL;
    }

    page.hostname = "www.facebook.com";
    page.hash = "";
    return page.toString();
  } catch {
    return DEFAULT_PAGE_URL;
  }
}
