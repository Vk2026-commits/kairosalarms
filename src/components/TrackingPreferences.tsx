import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getMetaTrackingPreference,
  saveMetaTrackingPreference,
  type MetaTrackingPreference,
} from "@/lib/tracking-preferences";

export function TrackingPreferences({
  reload = () => window.location.reload(),
}: {
  reload?: () => void;
}) {
  const [preference, setPreference] = useState<MetaTrackingPreference | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const sync = () => setPreference(getMetaTrackingPreference());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function change(optedOut: boolean) {
    setError(null);
    try {
      saveMetaTrackingPreference(optedOut);
      setPreference(getMetaTrackingPreference());
      setSaving(true);
      // A fresh document removes an already loaded Pixel; future calls respect the saved choice.
      reload();
    } catch (problem) {
      setSaving(false);
      setError(
        problem instanceof Error ? problem.message : "The tracking choice could not be saved.",
      );
    }
  }
  return (
    <section
      id="ad-tracking"
      aria-labelledby="ad-tracking-heading"
      className="scroll-mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8"
    >
      <h2
        id="ad-tracking-heading"
        className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-foreground"
      >
        Your Meta ad-tracking choice
      </h2>
      <p className="mt-3 text-sm leading-7 text-foreground">
        Turn off future site-controlled Meta Pixel events in this browser. Saving a choice reloads
        this page to stop an already loaded Pixel. It does not remove information previously sent to
        Meta, disable our lead form or first-party campaign attribution, or withdraw permission to
        contact you.
      </p>
      <p role="status" className="mt-4 text-sm font-semibold text-foreground">
        {!preference
          ? "Checking this browser's preference…"
          : saving
            ? "Choice saved. Reloading…"
            : preference.globalPrivacyControl
              ? "Meta tracking is off because your browser sends Global Privacy Control."
              : preference.optedOut
                ? "Meta tracking is off in this browser."
                : "Meta tracking is not opted out in this browser. It only runs on our published production site."}
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {preference && !preference.globalPrivacyControl && (
        <Button
          type="button"
          className="mt-4 min-h-11"
          disabled={saving}
          onClick={() => change(!preference.optedOut)}
        >
          {preference.optedOut ? "Allow Meta ad tracking" : "Turn off Meta ad tracking"}
        </Button>
      )}
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        This choice applies to this browser and device. Clearing browser storage may reset it.
        Global Privacy Control takes priority over an allow choice. You can also review{" "}
        <a
          href="https://www.facebook.com/privacy/policy/"
          className="font-medium text-primary underline underline-offset-4"
        >
          Meta's Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href="https://youradchoices.com/control"
          className="font-medium text-primary underline underline-offset-4"
        >
          industry advertising choices
        </a>
        .
      </p>
    </section>
  );
}
