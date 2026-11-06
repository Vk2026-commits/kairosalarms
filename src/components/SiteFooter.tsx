import { MapPin } from "lucide-react";
import { BUSINESS_PHONE } from "@/lib/business-phone";

export function SiteFooter() {
  const linkClass =
    "inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-semibold text-white underline decoration-white/60 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";
  return (
    <footer className="bg-navy-deep px-5 py-7 text-center text-sm text-white/80">
      <p className="flex items-center justify-center gap-1.5 font-semibold text-white">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Proudly serving Houston and the
        surrounding areas
      </p>
      <nav
        aria-label="Privacy and contact"
        className="mt-3 flex flex-wrap items-center justify-center gap-x-3"
      >
        <a href="/privacy" className={linkClass}>
          Privacy Policy
        </a>
        <a href="/privacy#ad-tracking" className={linkClass}>
          Ad tracking choices
        </a>
        <a href="mailto:inquiry@kairossecurity.com" className={linkClass}>
          Contact Kairos
        </a>
        <a href={`tel:${BUSINESS_PHONE}`} className={linkClass}>
          1-888-524-7678
        </a>
      </nav>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6">
        This site uses Meta Pixel and browser storage for advertising measurement and targeting. Our
        Privacy Policy explains what is collected, who receives it, and your choices.
      </p>
      <p className="mt-4 text-xs">
        © {new Date().getFullYear()} Kairos Security. All rights reserved.
      </p>
    </footer>
  );
}
