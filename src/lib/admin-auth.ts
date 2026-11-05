import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestIP,
  getRequestUrl,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server";

export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
export const ADMIN_SESSION_EXPIRED = "Your admin session has expired. Sign in again.";
const encoder = new TextEncoder();
const attempts = new Map<string, { count: number; expiresAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;

type SessionPayload = { expiresAt: number; issuedAt: number; nonce: string; origin: string };

export function privateAdminResponse(): void {
  setResponseHeader("Cache-Control", "private, no-store, max-age=0");
  setResponseHeader("Pragma", "no-cache");
  setResponseHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}

export function getAdminPasscode(): string | null {
  const value = process.env["KAIROS_ADMIN_PASSCODE"]?.trim();
  return value && value.length >= 12 && value.length <= 256 ? value : null;
}

function requestOrigin(): string {
  return getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin;
}

export function assertAdminSameOrigin(): void {
  privateAdminResponse();
  const origin = getRequestHeader("origin");
  if (!origin || origin !== requestOrigin()) {
    throw new Error("This action must be made from the admin page on this site.");
  }
}

function cookieOptions() {
  const url = getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
  const localHttp =
    url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  return {
    name: localHttp ? "kairos_admin_local" : "__Host-kairos_admin",
    options: {
      httpOnly: true,
      secure: !localHttp,
      sameSite: localHttp ? ("lax" as const) : ("none" as const),
      path: "/",
    },
  };
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid session");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "=")), (c) =>
    c.charCodeAt(0),
  );
}
async function signingKey(passcode: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`kairos-admin-session-v1:${passcode}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Pure helpers are exported for verification tests; callers must still authorize request handlers. */
export async function createAdminSessionToken(
  passcode: string,
  origin: string,
  now = Date.now(),
): Promise<{ token: string; expiresAt: number }> {
  const payload: SessionPayload = {
    expiresAt: now + ADMIN_SESSION_SECONDS * 1000,
    issuedAt: now,
    nonce: crypto.randomUUID(),
    origin,
  };
  const encoded = base64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(passcode),
    encoder.encode(encoded),
  );
  return {
    token: `${encoded}.${base64Url(new Uint8Array(signature))}`,
    expiresAt: payload.expiresAt,
  };
}

export async function verifyAdminSessionToken(
  token: string | undefined,
  passcode: string,
  origin: string,
  now = Date.now(),
): Promise<number | null> {
  if (!token || token.length > 2048) return null;
  try {
    const parts = token.split(".");
    const [encoded, signatureText] = parts;
    if (parts.length !== 2 || !encoded || !signatureText) return null;
    const signature = decodeBase64Url(signatureText);
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        await signingKey(passcode),
        signature,
        encoder.encode(encoded),
      ))
    )
      return null;
    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encoded)),
    ) as SessionPayload;
    if (
      !Number.isFinite(payload.expiresAt) ||
      !Number.isFinite(payload.issuedAt) ||
      payload.expiresAt <= now ||
      payload.issuedAt > now + 30_000 ||
      payload.expiresAt - payload.issuedAt !== ADMIN_SESSION_SECONDS * 1000 ||
      typeof payload.nonce !== "string" ||
      payload.origin !== origin
    )
      return null;
    return payload.expiresAt;
  } catch {
    return null;
  }
}

export async function readAdminSession(): Promise<number | null> {
  privateAdminResponse();
  const passcode = getAdminPasscode();
  if (!passcode) return null;
  const { name } = cookieOptions();
  return verifyAdminSessionToken(getCookie(name), passcode, requestOrigin());
}

export async function requireAdmin(): Promise<void> {
  if (!(await readAdminSession())) throw new Error(ADMIN_SESSION_EXPIRED);
}

/** Per-runtime rate limiter. Configure a host/WAF rule for a distributed limit as documented. */
export function consumeAdminLoginAttempt(now = Date.now()): void {
  privateAdminResponse();
  for (const [key, value] of attempts) if (value.expiresAt <= now) attempts.delete(key);
  const ip = getRequestHeader("cf-connecting-ip") ?? getRequestIP() ?? "unknown";
  for (const [key, limit] of [
    [`ip:${ip}`, 8],
    ["global", 200],
  ] as const) {
    const bucket = attempts.get(key) ?? { count: 0, expiresAt: now + WINDOW_MS };
    if (bucket.count >= limit || attempts.size > 10_000)
      throw new Error("Too many sign-in attempts. Please wait 15 minutes and try again.");
    bucket.count += 1;
    attempts.set(key, bucket);
  }
}

export async function verifyAdminPasscode(candidate: string, expected: string): Promise<boolean> {
  // HMAC verification compares fixed-size signatures without an early-return string comparison.
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode("kairos-passcode-comparison-v1"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(expected));
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(candidate));
}

export async function startAdminSession(passcode: string): Promise<number> {
  const { token, expiresAt } = await createAdminSessionToken(passcode, requestOrigin());
  const { name, options } = cookieOptions();
  setCookie(name, token, { ...options, maxAge: ADMIN_SESSION_SECONDS });
  return expiresAt;
}

export function clearAdminSession(): void {
  privateAdminResponse();
  const { name, options } = cookieOptions();
  deleteCookie(name, options);
}
