export function formatAdminDate(value: string | null, includeTime = false): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? ({ hour: "numeric", minute: "2-digit" } as const) : {}),
  }).format(date);
}

/** datetime-local displays wall time in the operator's timezone, not UTC. */
export function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localDateTimeToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || toLocalDateTime(date.toISOString()) !== value) {
    throw new Error("Enter a valid local follow-up date and time.");
  }
  return date.toISOString();
}

export function phoneHref(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15) return undefined;
  return `tel:${value.trim().startsWith("+") ? "+" : ""}${digits}`;
}

export function emailHref(value: string): string | undefined {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return undefined;
  return `mailto:${encodeURIComponent(value)}`;
}

export function adminErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  return fallback;
}

export function isAdminAuthError(error: unknown): boolean {
  const message = adminErrorMessage(error, "");
  if (
    /admin session|session.*expir|unauthori[sz]ed|unauthenticated|not authenticated|sign in again|(?:passcode|admin access).*not configured/i.test(
      message,
    )
  )
    return true;
  if (typeof error === "object" && error !== null) {
    if ("status" in error && (error.status === 401 || error.status === 403)) return true;
    if ("statusCode" in error && (error.statusCode === 401 || error.statusCode === 403))
      return true;
  }
  return false;
}
