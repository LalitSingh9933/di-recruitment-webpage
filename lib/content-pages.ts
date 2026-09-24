export const contentPages = {
  introduction: {
    title: "Introduction",
    eyebrow: "Welcome to D.I. Recruitment",
    description: "Connecting Nepalese talent with international opportunities.",
    content:
      "D.I. Recruitment Agency Pvt. Ltd. is based in Kathmandu, Nepal. We connect job seekers with international employers and guide candidates through the recruitment process.\n\nOur work brings together employment consultation, candidate preparation, language training, and support with documentation. We believe clear information and respectful communication are essential at every stage.\n\nWhether you are planning your next career step or looking for people to join your business, our team is here to talk through your needs.",
  },
  "vision-mission-goals": {
    title: "Our Vision, Mission & Goals",
    eyebrow: "What guides us",
    description: "A shared purpose behind every opportunity.",
    content:
      "Our vision\nTo be a trusted recruitment partner that opens international career opportunities for Nepalese workers.\n\nOur mission\nTo connect employers with prepared candidates through transparent communication, professional service, and care for the people involved.\n\nOur goals\nBuild lasting relationships with employers and candidates.\nHelp candidates develop the skills and confidence they need.\nKeep improving the recruitment experience, from the first conversation to placement.",
  },
  "chairman-message": {
    title: "Message from the Chairman",
    eyebrow: "From our leadership",
    description: "A message from the leadership of D.I. Recruitment.",
    content:
      "The chairman’s message will be published here soon. In the meantime, please contact our team to learn more about our agency and services.",
  },
  "managing-director-message": {
    title: "Message from the Managing Director",
    eyebrow: "From our leadership",
    description: "A message from the managing director of D.I. Recruitment.",
    content:
      "The managing director’s message will be published here soon. Please contact our team to learn more about our agency and services.",
  },
  "legal-documents": {
    title: "Legal Documents",
    eyebrow: "Transparency & trust",
    description: "Published registration and licensing documents.",
    content:
      "View the documents published by our agency below. For questions about registration or licensing, contact our team directly.",
  },
} as const;
export type ContentSlug = keyof typeof contentPages;
export function isContentSlug(slug: string): slug is ContentSlug {
  return Object.prototype.hasOwnProperty.call(contentPages, slug);
}
