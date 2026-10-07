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
import heroImg from "@/assets/hero-home.jpg";
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

  const H = "font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-foreground";
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero — dark photo with burgundy wash */}
      <section className="relative overflow-hidden bg-navy-deep text-primary-foreground">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(90deg, var(--burgundy-deep) 15%, color-mix(in oklab, var(--burgundy-deep) 75%, transparent) 55%, color-mix(in oklab, var(--burgundy-deep) 40%, transparent))" }}
        />

        {/* Utility bar */}
        <div className="relative z-10 border-b border-primary-foreground/10 text-[11px] text-primary-foreground/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Locally owned · Monitored 24/7</span>
            <span className="hidden items-center gap-1.5 sm:flex"><Phone className="h-3 w-3" /> (281) 555-0134</span>
          </div>
        </div>

        {/* Header */}
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="flex items-center gap-3">
            <img src={logo.url} alt="Kairos Security logo" className="h-11 w-auto" />
            <span className="leading-tight">
              <span className="block font-['Plus_Jakarta_Sans'] text-base font-extrabold">Kairos</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">Home Security</span>
            </span>
          </span>
          <a
            href={`tel:${PHONE}`}
            onClick={() => trackEvent("CallCTAClicked", { location: "header" })}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground ring-1 ring-primary-foreground/20 transition-colors hover:bg-burgundy-mid"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">(281) 555-0134</span>
            <span className="sm:hidden">Call</span>
          </a>
        </header>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-14 lg:pb-24">
          <div className="animate-fade-up">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" /> No credit check · Professionally installed
            </p>
            <h1 className="mt-4 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Home security that <span className="text-gold-soft">watches</span> so you can rest.
            </h1>
            <p className="mt-5 max-w-lg text-base text-primary-foreground/75 sm:text-lg">
              Monitored alarms, doorbell cameras, and smart sensors — starting at{" "}
              <span className="font-bold text-primary-foreground">$39.99/mo</span>, with no credit check required.
            </p>
            <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-2 sm:max-w-md">
              {[
                { k: "Starting at", v: "$39.99/mo" },
                { k: "Monitoring", v: "24/7" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">{s.k}</p>
                  <p className="mt-1 font-['Plus_Jakarta_Sans'] text-2xl font-extrabold">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-foreground">
            <QuoteFunnel />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 text-sm text-muted-foreground">
          {[
            { icon: BadgeCheck, label: "Starting at $39.99/mo" },
            { icon: CreditCard, label: "No credit check" },
            { icon: Radio, label: "24/7 monitoring available" },
            { icon: Wrench, label: "Professional installation" },
          ].map((i) => (
            <span key={i.label} className="flex items-center gap-2">
              <i.icon className="h-4 w-4 text-primary" /> {i.label}
            </span>
          ))}
        </div>
      </section>

      {/* Why Kairos */}
      <section className="bg-secondary px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className={`${H} text-center text-3xl sm:text-5xl`}>Security Without the Runaround</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            A local team, simple options, and a clear starting price.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              { icon: CreditCard, title: "No Credit Check", body: "Get pricing and security options without going through a credit qualification process." },
              { icon: MapPin, title: "Local Security Professionals", body: "Work with a local company instead of a national call center." },
              { icon: Radio, title: "Professional Monitoring", body: "Get around-the-clock protection and support." },
              { icon: Settings2, title: "Options Built Around Your Property", body: "Choose the protection you need without paying for unnecessary equipment." },
            ].map((b) => (
              <div key={b.title} className="flex gap-4 rounded-xl border border-border bg-card p-6 shadow-soft">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <b.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className={`${H} text-xl`}>{b.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className={`${H} text-3xl sm:text-5xl`}>How It Works</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              { title: "Answer 3 Quick Questions", body: "Tell us about your property in under 60 seconds." },
              { title: "Get Your Options", body: "See a setup and starting price built around your needs." },
              { title: "Professional Install", body: "A local Kairos technician installs and activates your system." },
            ].map((s, i) => (
              <div key={s.title} className="flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-['Plus_Jakarta_Sans'] font-extrabold text-lg font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className={`${H} mt-5 text-xl`}>{s.title}</h3>
                <p className="mt-2 max-w-xs text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-secondary px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className={`${H} text-center text-3xl sm:text-5xl`}>The Kairos Difference</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-7">
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg font-semibold uppercase tracking-wide text-muted-foreground">
                Big National Companies
              </h3>
              <ul className="mt-5 space-y-4">
                {["Complicated qualification", "Long phone calls", "National call centers", "Hard to understand pricing"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-muted-foreground">
                    <X className="h-5 w-5 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border-2 border-primary bg-card p-7 shadow-lift">
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg font-semibold uppercase tracking-wide text-primary">
                Kairos Security
              </h3>
              <ul className="mt-5 space-y-4">
                {["No credit check required", "Simple security options", "Local service", "Clear starting price"].map((t) => (
                  <li key={t} className="flex items-center gap-3 font-medium">
                    <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof — placeholders until real reviews are provided */}
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className={`${H} text-center text-3xl sm:text-5xl`}>What Local Customers Say</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {["Local Homeowner", "Business Owner", "Property Manager"].map((role) => (
              <div key={role} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <span className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <p className="mt-4 italic text-muted-foreground">[Placeholder — real customer review goes here]</p>
                <p className="mt-4 text-sm font-semibold">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary px-5 py-16 text-center text-primary-foreground sm:py-20">
        <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl font-bold tracking-tight sm:text-5xl">
          See What Home Security Could Cost You
        </h2>
        <p className="mt-4 text-lg opacity-80">Starting at $39.99/mo with no credit check required.</p>
        <Button
          type="button"
          onClick={() => startQuote("final_cta")}
          className="mt-8 h-14 w-full rounded-lg bg-card px-10 font-['Plus_Jakarta_Sans'] font-extrabold text-lg font-semibold uppercase tracking-wide text-primary hover:bg-secondary sm:w-auto"
        >
          Find My Security Fit →
        </Button>
      </section>
      <footer className="bg-navy-deep px-5 py-6 text-center text-xs text-primary-foreground/70">
        © {new Date().getFullYear()} Kairos Security. All rights reserved.
      </footer>
    </div>
  );
}
