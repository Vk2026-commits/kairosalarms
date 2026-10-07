/**
 * Funnel analytics for the Kairos landing page.
 *
 * Events are pushed to window.dataLayer (GTM-compatible) and to
 * window.fbq (Meta Pixel) when present. UTM parameters and Meta ad
 * identifiers (fbclid, fbp, fbc) are captured on first load and preserved
 * throughout the funnel so they can be attached to the lead payload and
 * to a future Conversions API integration.
 */

export type FunnelEvent =
  | "PageView"
  | "CTAClick"
  | "QuoteStarted"
  | "Question1Completed"
  | "Question2Completed"
  | "Question3Completed"
  | "LeadSubmitted"
  | "CallCTAClicked";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
}

const ATTRIBUTION_KEY = "kairos_attribution";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function captureAttribution(): Attribution {
  try {
    const existing = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (existing) return JSON.parse(existing) as Attribution;
  } catch {
    /* ignore */
  }

  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const) {
    const value = params.get(key);
    if (value) attribution[key] = value;
  }
  const fbp = readCookie("_fbp");
  if (fbp) attribution.fbp = fbp;
  const fbc = readCookie("_fbc");
  if (fbc) attribution.fbc = fbc;
  else if (attribution.fbclid) {
    attribution.fbc = `fb.1.${Date.now()}.${attribution.fbclid}`;
  }

  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    /* ignore */
  }
  return attribution;
}

export function getAttribution(): Attribution {
  return captureAttribution();
}

export function trackEvent(event: FunnelEvent, data: Record<string, unknown> = {}) {
  const payload = { event, ...data, ...getAttribution(), timestamp: new Date().toISOString() };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);

  // Meta Pixel mapping (no-op until the pixel is installed).
  const metaEvents: Partial<Record<FunnelEvent, string>> = {
    PageView: "PageView",
    QuoteStarted: "InitiateCheckout",
    LeadSubmitted: "Lead",
    CallCTAClicked: "Contact",
  };
  const metaEvent = metaEvents[event];
  if (metaEvent && typeof window.fbq === "function") {
    window.fbq("track", metaEvent, data);
  }
}
