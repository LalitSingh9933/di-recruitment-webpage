import { Navbar } from "@/components/navbar";
import { ContactForm } from "@/components/contact-form";
export const metadata = { title: "Contact us | D.I. Recruitment" };
export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container contact-page">
          <div className="eyebrow">Let’s connect</div>
          <h1>Contact our team</h1>
          <p>Tell us how we can help with your career or recruitment needs.</p>
          <ContactForm />
        </div>
      </main>
    </>
  );
}
