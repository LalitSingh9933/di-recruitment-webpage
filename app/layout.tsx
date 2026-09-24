import type { Metadata } from "next";
import "./tailwind.css";
import "./globals.css";
import "./theme.css";
import "./blog.css";
import "./gallery.css";
import "./facebook.css";
import "./account.css";
import "./content-images.css";
import "./engagement.css";

export const metadata: Metadata = {
  title: "D.I. Recruitment Agency | Global Careers, Trusted Guidance",
  description:
    "Ethical international recruitment connecting Nepalese talent with trusted global employers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
