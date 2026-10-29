/**
 * Meta Pixel — installed once for the whole site from the root route.
 * Only PageView and Lead are sent, with no form contents or personal data.
 * Visitors who opt out (Global Privacy Control, or localStorage
 * "kairos_tracking_optout" = "1") never load the pixel.
 */
export const META_PIXEL_ID = "4539741692932903";
const PRODUCTION_HOSTNAME = "alarms.kairossecurity.com";
const LEAD_FIRED_KEY = "kairos_meta_leads";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

let initialized = false;
let lastPageViewUrl: string | null = null;

export function hasTrackingConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD || window.location.hostname !== PRODUCTION_HOSTNAME) return false;
  try {
    if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
    if (window.localStorage.getItem("kairos_tracking_optout") === "1") return false;
  } catch {
    /* ignore */
  }
  return true;
}

export function initMetaPixel(): boolean {
  if (typeof window === "undefined" || !hasTrackingConsent()) return false;
  if (initialized) return true;
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (!w.fbq) {
    const n: Fbq = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue?.push(args);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    w.fbq = n;
    w._fbq = n;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  w.fbq?.("init", META_PIXEL_ID);
  initialized = true;
  return true;
}

/** Fires PageView once per distinct URL (page load or real navigation). */
export function trackMetaPageView(url: string) {
  if (url === lastPageViewUrl) return;
  if (!initMetaPixel()) return;
  lastPageViewUrl = url;
  window.fbq?.("track", "PageView");
}

/** Fires Lead once per confirmed submission id; never repeats on refresh. */
export function trackMetaLead(submissionId: string) {
  if (!initMetaPixel()) return;
  let fired: string[] = [];
  try {
    fired = JSON.parse(window.localStorage.getItem(LEAD_FIRED_KEY) ?? "[]");
  } catch {
    /* ignore */
  }
  if (fired.includes(submissionId)) return;
  window.fbq?.("track", "Lead", {}, { eventID: submissionId });
  try {
    window.localStorage.setItem(LEAD_FIRED_KEY, JSON.stringify([...fired, submissionId].slice(-20)));
  } catch {
    /* ignore */
  }
}
