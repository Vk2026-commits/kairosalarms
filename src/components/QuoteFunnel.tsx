import { useRef, useState } from "react";
import {
  Bell,
  ArrowLeft,
  ArrowRight,
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
import { Button } from "@/components/ui/button";

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

export function QuoteFunnel() {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<QuoteAnswers>({});
  const [form, setForm] = useState({ firstName: "", phone: "", email: "", zip: "" });
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);
  const advancing = useRef(false);

  function answer(key: keyof QuoteAnswers, value: string, questionIndex: number) {
    if (advancing.current) return;
    advancing.current = true;
    if (!hasStarted.current) {
      trackEvent("CTAClick", { location: "diagnostic_answer" });
      trackEvent("QuoteStarted", { location: "opening_diagnostic" });
      hasStarted.current = true;
    }
    setAnswers((prev) => ({ ...prev, [key]: value }));
    const event = QUESTION_EVENTS[questionIndex];
    if (event) trackEvent(event, { [key]: value });
    // Auto-advance after a single-choice answer.
    window.setTimeout(() => {
      setStep((questionIndex + 1) as Step);
      advancing.current = false;
    }, 220);
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

  return (
    <div ref={containerRef} id="quote" className="scroll-mt-6 text-left">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-lift">
        {/* Progress */}
        {step < 4 && (
          <div className="border-b border-border px-5 pt-5 pb-4 sm:px-8">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{step < 3 ? `Question ${step + 1} of 3` : "Your details"}</span>
              <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> No credit check</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div key={step} className="animate-funnel-in p-5 sm:p-8">
          {step > 0 && step < 4 && (
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" onClick={() => { if (!advancing.current) setStep((step - 1) as Step); }}>
              <ArrowLeft /> Back
            </Button>
          )}
          {step <= 2 && <QuestionStep step={step as 0 | 1 | 2} answers={answers} onAnswer={answer} />}

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
                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Show My Options
                </Button>
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

function QuestionStep({
  step,
  answers,
  onAnswer,
}: {
  step: 0 | 1 | 2;
  answers: QuoteAnswers;
  onAnswer: (key: keyof QuoteAnswers, value: string, questionIndex: number) => void;
}) {
  const question = QUESTIONS[step];
  if (!question) return null;
  return (
    <>
      <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">{question.question}</h2>
      <div className={`mt-6 grid gap-3 ${step === 0 ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        {question.options.map((option) => {
          const Icon = option.icon;
          const selected = answers[question.key] === option.value;
          return (
            <Button
              variant="outline"
              key={option.value}
              type="button"
              onClick={() => onAnswer(question.key, option.value, step)}
              aria-pressed={selected}
              className={`h-auto whitespace-normal rounded-lg border-2 text-base font-semibold transition-all active:scale-[0.98] hover:text-foreground ${step === 0 ? "min-h-36 flex-col gap-3 px-3 py-5 sm:min-h-40" : "min-h-20 justify-start gap-3 px-4 py-4 text-left"} ${
                selected
                  ? "border-accent bg-accent/5 text-foreground"
                  : "border-border bg-background text-foreground hover:border-accent/50 hover:bg-secondary"
              }`}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-lg ${step === 0 ? "h-16 w-16 [&_svg]:size-9" : "h-10 w-10"} ${
                  selected ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {option.label}
              {step !== 0 && (selected ? <Check className="ml-auto h-5 w-5 text-accent" /> : <ArrowRight className="ml-auto text-muted-foreground" />)}
            </Button>
          );
        })}
      </div>
    </>
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
      <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
        {firstName ? `${firstName}, we` : "We"} Found Your Best Starting Point
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
