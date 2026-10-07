import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  CreditCard,
  MapPin,
  Phone,
  Radio,
  Settings2,
  Star,
  Wrench,
  X,
} from "lucide-react";
import heroImage from "@/assets/hero-home.jpg";
import { QuoteFunnel } from "@/components/QuoteFunnel";
import { captureAttribution, trackEvent } from "@/lib/tracking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kairos Security — Home Security Starting at $39.99/mo" },
      {
        name: "description",
        content:
          "Professionally monitored home security starting at $39.99/mo. No credit check required. Get your personalized options in under 60 seconds.",
      },
      { property: "og:title", content: "Kairos Security — Home Security Starting at $39.99/mo" },
      {
        property: "og:description",
        content: "Professional alarm monitoring with no credit check required. See your options in 60 seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PHONE = "+12815550134";

function Index() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    captureAttribution();
    trackEvent("PageView");
  }, []);

  function startQuote(location: string) {
    trackEvent("CTAClick", { location });
    if (!started) trackEvent("QuoteStarted", { location });
    setStarted(true);
    window.setTimeout(() => {
      document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <span className="font-['Sora'] text-lg font-bold tracking-tight text-navy-foreground">
            KAIROS<span className="text-accent"> SECURITY</span>
          </span>
          <a
            href={`tel:${PHONE}`}
            onClick={() => trackEvent("CallCTAClicked", { location: "header" })}
            className="flex items-center gap-2 rounded-full border border-navy-foreground/20 px-4 py-2 text-sm font-medium text-navy-foreground backdrop-blur transition-colors hover:bg-navy-foreground/10"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">(281) 555-0134</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-deep">
        <img
          src={heroImage}
          alt="Modern home at dusk with discreet security camera and doorbell camera"
          width={1600}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-navy-deep/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-navy-deep/50" />

        <div className="relative mx-auto max-w-6xl px-5 pt-28 pb-14 sm:pt-36 sm:pb-20">
          <div className="max-w-xl animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-navy-foreground/10 px-3 py-1.5 text-xs font-semibold text-navy-foreground backdrop-blur">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              Local installation &amp; support
            </p>
            <h1 className="mt-5 text-4xl leading-[1.08] font-bold text-navy-foreground text-balance sm:text-6xl">
              Protect Your Home Starting at{" "}
              <span className="text-accent">$39.99/mo</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-navy-muted sm:text-xl">
              Professionally monitored security.{" "}
              <span className="font-semibold text-navy-foreground">No credit check required.</span>
            </p>
            <button
              type="button"
              onClick={() => startQuote("hero")}
              className="mt-8 flex h-16 w-full items-center justify-center rounded-xl bg-accent px-10 text-lg font-bold text-accent-foreground shadow-lift transition-all hover:brightness-110 active:scale-[0.99] sm:w-auto"
            >
              See My Options
            </button>
            <p className="mt-3 text-sm text-navy-muted">Get your options in under 60 seconds.</p>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="relative z-10 mx-auto -mt-6 max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-lift md:grid-cols-4">
          {[
            { icon: BadgeCheck, label: "Starting at $39.99/mo" },
            { icon: CreditCard, label: "No Credit Check" },
            { icon: Radio, label: "24/7 Monitoring Available" },
            { icon: Wrench, label: "Professional Installation" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 bg-card px-4 py-4 sm:px-5 sm:py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold leading-tight text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quote funnel */}
      <section className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <QuoteFunnel started={started} onStart={() => startQuote("funnel_card")} />
      </section>

      {/* Why Kairos */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          Security Without the Runaround
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: CreditCard,
              title: "No Credit Check",
              body: "Get pricing and security options without going through a credit qualification process.",
            },
            {
              icon: MapPin,
              title: "Local Security Professionals",
              body: "Work with a local company instead of a national call center.",
            },
            {
              icon: Radio,
              title: "Professional Monitoring",
              body: "Get around-the-clock protection and support.",
            },
            {
              icon: Settings2,
              title: "Options Built Around Your Property",
              body: "Choose the protection you need without paying for unnecessary equipment.",
            },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <b.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-secondary p-6 sm:p-8">
            <h3 className="text-lg font-bold text-muted-foreground">Big National Security Companies</h3>
            <ul className="mt-5 space-y-3">
              {["Complicated qualification", "Long phone calls", "National call centers", "Hard to understand pricing"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-navy p-6 shadow-lift sm:p-8">
            <h3 className="text-lg font-bold text-navy-foreground">Kairos Security</h3>
            <ul className="mt-5 space-y-3">
              {["No credit check required", "Simple security options", "Local service", "Clear starting price"].map((t) => (
                <li key={t} className="flex items-center gap-3 font-medium text-navy-foreground">
                  <Check className="h-5 w-5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Social proof — placeholders until real reviews are provided */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          Trusted By Local Homeowners &amp; Businesses
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-dashed border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  Google Review
                </span>
              </div>
              <p className="mt-4 text-sm italic leading-relaxed text-muted-foreground">
                [Placeholder — real customer review #{n} goes here]
              </p>
              <p className="mt-4 text-sm font-semibold text-foreground">[Customer name]</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-deep">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <h2 className="text-3xl font-bold text-navy-foreground text-balance sm:text-4xl">
            See What Home Security Could Cost You
          </h2>
          <p className="mt-4 text-lg text-navy-muted">
            Starting at $39.99/mo with no credit check required.
          </p>
          <button
            type="button"
            onClick={() => startQuote("final_cta")}
            className="mt-8 h-16 w-full rounded-xl bg-accent px-10 text-lg font-bold text-accent-foreground shadow-lift transition-all hover:brightness-110 active:scale-[0.99] sm:w-auto"
          >
            See My Options
          </button>
        </div>
        <footer className="border-t border-navy-foreground/10 px-5 py-6 text-center text-xs text-navy-muted">
          © {new Date().getFullYear()} Kairos Security. All rights reserved.
        </footer>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => startQuote("sticky_mobile")}
          className="h-14 w-full rounded-xl bg-accent text-base font-bold text-accent-foreground"
        >
          See My Options
        </button>
      </div>
    </div>
  );
}
