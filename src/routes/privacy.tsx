import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackingPreferences } from "@/components/TrackingPreferences";
import { PRIVACY_CONTACT, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/lib/privacy-policy";
import { BUSINESS_PHONE } from "@/lib/business-phone";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Kairos Security Total Home Protection Plan" },
      {
        name: "description",
        content:
          "How Kairos Security handles inquiries, contact information, cookies, Meta ad tracking, and your privacy choices.",
      },
      { property: "og:title", content: "Privacy Policy | Kairos Security" },
      {
        property: "og:description",
        content: "Read our website privacy disclosures and manage Meta ad-tracking choices.",
      },
    ],
  }),
  component: PrivacyPage,
});

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#privacy-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-4 focus:text-primary"
      >
        Skip to privacy policy
      </a>
      <header className="bg-burgundy-deep px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <a
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home security options
          </a>
          <p className="mt-6 text-sm font-semibold text-white/80">
            Kairos Security Total Home Protection Plan
          </p>
          <h1 className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-white/80">Last updated: {PRIVACY_UPDATED}</p>
        </div>
      </header>
      <main id="privacy-content" className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-base leading-8 text-muted-foreground">
          Understand how your inquiry is handled and choose whether this browser sends Meta
          ad-tracking events. Your privacy choice does not prevent you from requesting home security
          options.
        </p>
        <nav
          aria-label="Privacy policy sections"
          className="my-8 flex flex-wrap gap-x-5 gap-y-2 border-y border-border py-4"
        >
          {PRIVACY_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {section.title}
            </a>
          ))}
          <a
            href="#ad-tracking"
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Ad tracking choices
          </a>
        </nav>
        <div className="space-y-9">
          {PRIVACY_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-8"
            >
              <h2
                id={`${section.id}-heading`}
                className="font-['Plus_Jakarta_Sans'] text-xl font-bold sm:text-2xl"
              >
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-base leading-8 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <TrackingPreferences />
          <section
            aria-labelledby="privacy-contact-heading"
            className="border-t border-border pt-8"
          >
            <h2
              id="privacy-contact-heading"
              className="font-['Plus_Jakarta_Sans'] text-xl font-bold"
            >
              Contact Kairos about privacy
            </h2>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              For privacy questions, requests about your inquiry, or to ask us to stop contacting
              you, email{" "}
              <a
                href={`mailto:${PRIVACY_CONTACT}`}
                className="break-words font-semibold text-primary underline underline-offset-4"
              >
                {PRIVACY_CONTACT}
              </a>{" "}
              or call{" "}
              <a
                href={`tel:${BUSINESS_PHONE}`}
                className="font-semibold text-primary underline underline-offset-4"
              >
                1-888-524-7678
              </a>
              . Please do not send passwords, payment information, or other sensitive documents.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
