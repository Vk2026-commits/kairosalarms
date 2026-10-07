import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
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
import logo from "@/assets/kairos-logo.png.asset.json";
import { QuoteFunnel } from "@/components/QuoteFunnel";
import { captureAttribution, trackEvent } from "@/lib/tracking";
import { Button } from "@/components/ui/button";

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
  useEffect(() => {
    captureAttribution();
    trackEvent("PageView");
  }, []);

  function startQuote(location: string) {
    trackEvent("CTAClick", { location });
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-burgundy-deep">
      {/* Hero — immersive burgundy with the diagnostic front and center */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, var(--burgundy-mid), var(--burgundy) 55%, var(--burgundy-deep))",
        }}
      >
        {/* Gold dot texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(var(--gold) 0.5px, transparent 0.5px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Header */}
        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-6 sm:py-8">
          <span className="flex items-center gap-3">
            <img src={logo.url} alt="Kairos Security logo" className="h-11 w-auto drop-shadow-md sm:h-12" />
            <span className="leading-none">
              <span className="block font-['Archivo_Black'] text-lg uppercase tracking-tighter text-navy-foreground">
                Kairos
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
                Security
              </span>
            </span>
          </span>
          <a
            href={`tel:${PHONE}`}
            onClick={() => trackEvent("CallCTAClicked", { location: "header" })}
            className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-sm font-semibold text-navy-foreground transition-colors hover:bg-gold/10"
          >
            <Phone className="h-4 w-4 text-gold" />
            <span className="hidden sm:inline">(281) 555-0134</span>
            <span className="sm:hidden">Call</span>
          </a>
        </header>

        <div className="relative z-10 mx-auto max-w-3xl px-4 pt-6 pb-20 text-center sm:pt-10 sm:pb-24">
          <div className="animate-fade-up">
            <h1 className="font-['Archivo_Black'] text-4xl uppercase leading-[0.95] text-navy-foreground sm:text-6xl">
              Home Security <br />
              <span className="bg-gradient-to-r from-gold via-gold-soft to-gold bg-clip-text text-transparent">
                Starting at $39.99/mo
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-lg font-light tracking-wide text-navy-muted sm:text-xl">
              Professionally monitored security.{" "}
              <span className="font-semibold text-navy-foreground">No credit check required.</span>
            </p>
            <div className="mt-10 sm:mt-12">
              <QuoteFunnel />
            </div>
            <p className="mt-8 text-sm font-medium tracking-wide text-navy-muted">
              Local installation &amp; support · Personalized to your property
            </p>
          </div>
        </div>
      </section>

      {/* Trust bar — clean white band */}
      <section className="bg-card py-8 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-6 px-6 md:justify-between">
          {[
            { icon: BadgeCheck, label: "Starting at $39.99/mo" },
            { icon: CreditCard, label: "No Credit Check" },
            { icon: Radio, label: "24/7 Monitoring Available" },
            { icon: Wrench, label: "Professional Installation" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-foreground/80">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="font-['Archivo_Black'] text-xs uppercase tracking-tight sm:text-sm">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Why Kairos — hairline grid on burgundy */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col items-center sm:mb-16">
            <h2 className="max-w-xl text-center font-['Archivo_Black'] text-3xl uppercase leading-[0.95] text-navy-foreground sm:text-5xl">
              Security Without the Runaround
            </h2>
            <div className="mt-6 h-1 w-16 bg-gold" />
          </div>
          <div className="grid gap-px bg-navy-foreground/10 md:grid-cols-2 lg:grid-cols-4">
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
              <div key={b.title} className="bg-burgundy-deep p-8 transition-colors hover:bg-burgundy sm:p-10">
                <b.icon className="h-8 w-8 text-gold" />
                <h3 className="mt-8 font-['Archivo_Black'] text-base uppercase leading-snug text-navy-foreground sm:text-lg">
                  {b.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-navy-foreground/50">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison — light band with VS divider */}
      <section className="bg-secondary px-6 py-20 text-foreground sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center sm:mb-16">
            <h2 className="font-['Archivo_Black'] text-3xl uppercase tracking-tighter sm:text-5xl">
              The Kairos Difference
            </h2>
            <div className="mx-auto mt-5 h-1.5 w-24 bg-primary" />
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-11 lg:gap-0">
            <div className="flex flex-col justify-center rounded-3xl border border-border bg-card p-8 opacity-70 grayscale-[40%] sm:p-10 lg:col-span-5 lg:rounded-r-none">
              <h3 className="mb-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Big National Security Companies
              </h3>
              <ul className="space-y-5">
                {["Complicated qualification", "Long phone calls", "National call centers", "Hard to understand pricing"].map((t) => (
                  <li key={t} className="flex items-center gap-4 text-muted-foreground">
                    <X className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                    <span className="font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="z-20 -my-3 flex items-center justify-center lg:col-span-1 lg:-mx-4 lg:my-0">
              <div className="flex h-12 w-12 rotate-12 items-center justify-center rounded-full bg-gold font-['Archivo_Black'] text-sm text-primary shadow-lift ring-4 ring-secondary">
                VS
              </div>
            </div>

            <div className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-lift sm:p-10 lg:col-span-5 lg:-ml-4 lg:rounded-l-none">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gold opacity-10 blur-3xl" />
              <h3 className="mb-8 font-['Archivo_Black'] text-2xl uppercase tracking-tighter text-gold">
                Kairos Security
              </h3>
              <ul className="space-y-5">
                {["No credit check required", "Simple security options", "Local service", "Clear starting price"].map((t) => (
                  <li key={t} className="flex items-center gap-4">
                    <span className="rounded-md bg-gold p-1 text-primary">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span className="text-lg font-semibold tracking-tight">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof — placeholders until real reviews are provided */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <h2 className="font-['Archivo_Black'] text-3xl uppercase leading-[0.9] tracking-tighter text-navy-foreground sm:text-5xl">
              Trusted By Local <br />
              <span className="text-gold">Homeowners</span>
            </h2>
            <div className="flex items-center gap-2 pb-1">
              <span className="flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-navy-muted">
                Verified Reviews
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {["Local Homeowner", "Business Owner", "Property Manager"].map((role) => (
              <div key={role} className="rounded-2xl border border-navy-foreground/10 bg-navy-foreground/5 p-8">
                <p className="mb-6 leading-relaxed text-navy-foreground/70 italic">
                  [Placeholder — real customer review goes here]
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-navy-foreground/15" />
                  <div>
                    <p className="text-sm font-bold tracking-tight text-navy-foreground">{role}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                      Verified Client
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="border-t border-gold/20"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, var(--burgundy-mid), var(--burgundy) 55%, var(--burgundy-deep))",
        }}
      >
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-24">
          <h2 className="font-['Archivo_Black'] text-3xl uppercase leading-[0.95] text-navy-foreground text-balance sm:text-5xl">
            See What Home Security Could Cost You
          </h2>
          <p className="mt-5 text-lg font-light text-navy-muted">
            Starting at $39.99/mo with no credit check required.
          </p>
          <Button
            type="button"
            onClick={() => startQuote("final_cta")}
            className="mt-10 h-16 w-full rounded-xl bg-gold px-10 font-['Archivo_Black'] text-base uppercase tracking-tight text-primary shadow-lift transition-all hover:bg-gold-soft active:scale-[0.99] sm:w-auto sm:text-lg"
          >
            Find My Security Fit
          </Button>
        </div>
        <footer className="border-t border-navy-foreground/10 px-5 py-6 text-center text-xs text-navy-muted">
          © {new Date().getFullYear()} Kairos Security. All rights reserved.
        </footer>
      </section>
    </div>
  );
}
