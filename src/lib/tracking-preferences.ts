export const META_OPTOUT_KEY = "kairos_tracking_optout";
export type MetaTrackingPreference = { optedOut: boolean; globalPrivacyControl: boolean };

export function getMetaTrackingPreference(): MetaTrackingPreference {
  const globalPrivacyControl =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  let optedOut = false;
  if (typeof window !== "undefined") {
    try {
      optedOut = window.localStorage.getItem(META_OPTOUT_KEY) === "1";
    } catch {
      /* Browser storage may be restricted. */
    }
  }
  return { optedOut, globalPrivacyControl };
}

/** Save only a tracking choice, never contact information or authentication data. */
export function saveMetaTrackingPreference(optedOut: boolean): void {
  if (typeof window === "undefined")
    throw new Error("Tracking choices are available in your browser.");
  if (!optedOut && getMetaTrackingPreference().globalPrivacyControl)
    throw new Error("Your browser's Global Privacy Control signal keeps Meta tracking off.");
  try {
    if (optedOut) window.localStorage.setItem(META_OPTOUT_KEY, "1");
    else window.localStorage.removeItem(META_OPTOUT_KEY);
    if ((window.localStorage.getItem(META_OPTOUT_KEY) === "1") !== optedOut)
      throw new Error("Not saved");
  } catch {
    throw new Error(
      "Your browser could not save this choice. Use your browser's tracking controls or enable Global Privacy Control instead.",
    );
  }
  if (optedOut) {
    try {
      window.fbq?.("consent", "revoke");
    } catch {
      /* Saved guard plus document reload still stops site-controlled events. */
    }
  }
}
