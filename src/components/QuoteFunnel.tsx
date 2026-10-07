import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Building2,
  Camera,
  Check,
  DoorOpen,
  Home,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Video,
} from "lucide-react";
import { submitLead, type QuoteAnswers } from "@/lib/leads";
import { trackEvent } from "@/lib/tracking";

type Step = 0 | 1 | 2 | 3 | 4; // 0-2 questions, 3 lead form, 4 results

const QUESTIONS: {
  key: keyof QuoteAnswers;
  question: string;
  options: { value: string; label: string; icon: typeof Home }[];
}[] = [
  {
    key: "propertyType",
    question: "What are you looking to protect?",
    options: [
      { value: "home", label: "My Home", icon: Home },
      { value: "business", label: "My Business", icon: Building2 },
    ],
  },
  {
    key: "exteriorDoors",
    question: "How many exterior doors do you need protected?",
    options: [
      { value: "1", label: "1 door", icon: DoorOpen },
      { value: "2", label: "2 doors", icon: DoorOpen },
      { value: "3", label: "3 doors", icon: DoorOpen },
      { value: "4+", label: "4+ doors", icon: DoorOpen },
    ],
  },
  {
    key: "securityType",
    question: "What type of security are you interested in?",
    options: [
      { value: "alarm", label: "Alarm system", icon: Bell },
      { value: "alarm-doorbell", label: "Alarm + doorbell camera", icon: Video },
      { value: "alarm-cameras", label: "Alarm + cameras", icon: Camera },
      { value: "not-sure", label: "Not sure — show me my options", icon: ShieldCheck },
    ],
  },
];

const QUESTION_EVENTS = ["Question1Completed", "Question2Completed", "Question3Completed"] as const;

export function QuoteFunnel({ started, onStart }: { started: boolean; onStart: () => void }) {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<QuoteAnswers>({});
  const [form, setForm] = useState({ firstName: "", phone: "", email: "", zip: "" });
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started) {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [started]);

  function answer(key: keyof QuoteAnswers, value: string, questionIndex: number) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    const event = QUESTION_EVENTS[questionIndex];
    if (event) trackEvent(event, { [key]: value });
    // Auto-advance after a single-choice answer.
    window.setTimeout(() => setStep((questionIndex + 1) as Step), 220);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitLead({ ...answers, ...form });
      trackEvent("LeadSubmitted", { ...answers });
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  }

  if (!started) {
    return (
      <div ref={containerRef} id="quote" className="scroll-mt-24">
        <button
          type="button"
          onClick={onStart}
          className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:shadow-lift sm:p-6"
        >
          <div>
            <p className="text-base font-semibold text-foreground sm:text-lg">
              Get your personalized security options
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              3 quick questions · under 60 seconds · no credit check
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <ShieldCheck className="h-6 w-6" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} id="quote" className="scroll-mt-24">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
        {/* Progress */}
        {step < 3 && (
          <div className="border-b border-border px-5 pt-5 pb-4 sm:px-8">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Step {step + 1} of 3</span>
              <span>Finding your best security option…</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div key={step} className="animate-funnel-in p-5 sm:p-8">
          {step <= 2 && <QuestionStep step={step} answers={answers} onAnswer={answer} />}

          {step === 3 && (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Check className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                  Your Security Options Are Ready
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Enter your information and a Kairos security specialist will confirm the best
                setup and pricing for your property.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
                <input
                  required
                  type="text"
                  autoComplete="given-name"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="h-14 rounded-xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-ring/30"
                />
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="Mobile phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-14 rounded-xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-ring/30"
                />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-14 rounded-xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-ring/30"
                />
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  pattern="[0-9]{5}"
                  placeholder="ZIP code"
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  className="h-14 rounded-xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Show My Options
                </button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  By submitting, you agree that Kairos Security may contact you by phone, text, and
                  email about your security options, including using automated technology. Consent
                  is not a condition of purchase. Message and data rates may apply.
                </p>
              </form>
            </>
          )}

          {step === 4 && <Results answers={answers} firstName={form.firstName} />}
        </div>
      </div>
    </div>
  );
}

function Results({ answers, firstName }: { answers: QuoteAnswers; firstName: string }) {
  const property = answers.propertyType === "business" ? "business" : "home";
  const doors = answers.exteriorDoors ?? "your";
  const wantsCameras = answers.securityType === "alarm-cameras";
  const wantsDoorbell = answers.securityType === "alarm-doorbell";

  const inclusions = [
    { icon: ShieldCheck, label: "Professional 24/7 monitoring" },
    { icon: DoorOpen, label: `Protection for ${doors === "your" ? "your" : doors} exterior door${doors === "1" ? "" : "s"}` },
    { icon: Smartphone, label: "Mobile app control" },
    { icon: Bell, label: "Motion detection" },
    ...(wantsDoorbell
      ? [{ icon: Video, label: "Doorbell camera" }]
      : wantsCameras
        ? [{ icon: Camera, label: "Security cameras" }]
        : [{ icon: Camera, label: "Optional doorbell camera or security cameras" }]),
  ];

  return (
    <div>
      <p className="text-sm font-semibold tracking-wide text-accent uppercase">
        {firstName ? `${firstName}, we` : "We"} found your best starting point
      </p>
      <h3 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
        We Found Your Best Starting Point
      </h3>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">
        Based on your answers, a Kairos {property} security package may include:
      </p>
      <ul className="mt-5 grid gap-3">
        {inclusions.map((item) => (
          <li key={item.label} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-soft">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-foreground sm:text-base">{item.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-xl bg-primary p-5 text-center">
        <p className="text-lg font-bold text-primary-foreground sm:text-xl">
          Plans start at $39.99/mo
        </p>
        <p className="mt-1 text-sm text-primary-foreground/75">
          Final pricing depends on the equipment and protection your property needs.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href="tel:+12815550134"
          onClick={() => trackEvent("CallCTAClicked", { location: "results" })}
          className="flex h-14 items-center justify-center rounded-xl bg-accent text-base font-bold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
        >
          Talk With a Security Specialist
        </a>
        <a
          href="tel:+12815550134"
          onClick={() => trackEvent("CallCTAClicked", { location: "results_secondary" })}
          className="flex h-14 items-center justify-center rounded-xl border-2 border-primary text-base font-bold text-primary transition-all hover:bg-secondary active:scale-[0.99]"
        >
          Call Me About My Options
        </a>
      </div>
    </div>
  );
}
