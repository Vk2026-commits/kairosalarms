import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ADMIN_FILTERS, type AdminLeadUpdate } from "@/lib/admin";

const cookies = new Map<string, string>();
const request = {
  origin: "https://alarms.kairossecurity.com",
  headerOrigin: "https://alarms.kairossecurity.com",
  ip: "127.0.0.1",
};
const headers = vi.fn();
vi.mock("@tanstack/react-start/server", () => ({
  getRequestUrl: () => new URL(request.origin),
  getRequestHeader: (name: string) =>
    name === "origin" ? request.headerOrigin : name === "cf-connecting-ip" ? request.ip : undefined,
  getRequestIP: () => request.ip,
  getCookie: (name: string) => cookies.get(name),
  setCookie: vi.fn((name: string, value: string) => cookies.set(name, value)),
  deleteCookie: vi.fn((name: string) => cookies.delete(name)),
  setResponseHeader: (...args: unknown[]) => headers(...args),
}));

import {
  ADMIN_SESSION_SECONDS,
  assertAdminSameOrigin,
  clearAdminSession,
  consumeAdminLoginAttempt,
  createAdminSessionToken,
  getAdminPasscode,
  readAdminSession,
  requireAdmin,
  startAdminSession,
  verifyAdminPasscode,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import {
  buildAdminLeadParams,
  exportLeadCsv,
  getLeadPage,
  leadsToCsv,
  normalizeAdminLead,
  saveLeadManagement,
} from "@/lib/admin-data";

const passcode = "test-only-strong-passcode-12345";
const row = {
  id: "e33396bb-2ce7-4026-a658-5918d5d550af",
  created_at: "2026-11-05T16:00:00Z",
  first_name: "Taylor Johnson",
  email: "taylor@example.com",
  phone: "2815550123",
  zip: "77002",
  security_type: "alarm",
  call_consent: true,
  attribution: { utm_source: "facebook", utm_campaign: "test-campaign" },
};
const response = (rows: unknown[], count = rows.length) =>
  new Response(JSON.stringify(rows), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-range": `0-${Math.max(0, rows.length - 1)}/${count}`,
    },
  });

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  cookies.clear();
  request.headerOrigin = request.origin;
  request.ip = webcrypto.randomUUID();
  headers.mockClear();
  process.env["KAIROS_ADMIN_PASSCODE"] = passcode;
  process.env["KAIROS_SUPABASE_URL"] = "https://database.example.com";
  process.env["KAIROS_SUPABASE_SERVICE_KEY"] = "test-database-secret";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env["KAIROS_ADMIN_PASSCODE"];
  delete process.env["KAIROS_SUPABASE_URL"];
  delete process.env["KAIROS_SUPABASE_SERVICE_KEY"];
});

describe("Admin security", () => {
  it("fails closed with missing/short passcodes and no cookie", async () => {
    delete process.env["KAIROS_ADMIN_PASSCODE"];
    expect(getAdminPasscode()).toBeNull();
    await expect(requireAdmin()).rejects.toThrow("Sign in again");
    process.env["KAIROS_ADMIN_PASSCODE"] = "1234";
    expect(getAdminPasscode()).toBeNull();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(requireAdmin()).rejects.toThrow("Sign in again");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("compares passcodes and signs expiring, origin-bound, rotation-sensitive sessions", async () => {
    expect(await verifyAdminPasscode(passcode, passcode)).toBe(true);
    expect(await verifyAdminPasscode("wrong", passcode)).toBe(false);
    const now = 1_000_000;
    const { token, expiresAt } = await createAdminSessionToken(passcode, request.origin, now);
    expect(await verifyAdminSessionToken(token, passcode, request.origin, now)).toBe(expiresAt);
    expect(
      await verifyAdminSessionToken(token, "rotated-passcode-123", request.origin, now),
    ).toBeNull();
    expect(await verifyAdminSessionToken(`${token}x`, passcode, request.origin, now)).toBeNull();
    expect(
      await verifyAdminSessionToken(token, passcode, "https://attacker.example", now),
    ).toBeNull();
    expect(
      await verifyAdminSessionToken(
        token,
        passcode,
        request.origin,
        now + ADMIN_SESSION_SECONDS * 1000,
      ),
    ).toBeNull();
  });
  it("accepts a real session and clears it on logout", async () => {
    await startAdminSession(passcode);
    expect(await readAdminSession()).not.toBeNull();
    await expect(requireAdmin()).resolves.toBeUndefined();
    clearAdminSession();
    expect(await readAdminSession()).toBeNull();
    expect(headers).toHaveBeenCalledWith("Cache-Control", "private, no-store, max-age=0");
  });
  it("rejects cross-origin mutations and throttles repeated login attempts", () => {
    request.headerOrigin = "https://attacker.example";
    expect(assertAdminSameOrigin).toThrow("admin page");
    request.headerOrigin = request.origin;
    expect(assertAdminSameOrigin).not.toThrow();
    const now = Date.now();
    for (let attempt = 0; attempt < 8; attempt++) consumeAdminLoginAttempt(now);
    expect(() => consumeAdminLoginAttempt(now)).toThrow("Too many");
    expect(() => consumeAdminLoginAttempt(now + 15 * 60 * 1000 + 1)).not.toThrow();
  });
});

describe("Admin lead data", () => {
  it("uses explicit columns, pagination, safely quoted search, and null-aware filters", () => {
    const params = buildAdminLeadParams(
      { search: 'Taylor,Jane)"*', status: "new", assignedTo: "unassigned", dueOnly: true },
      25,
      50,
    );
    expect(params.get("select")).not.toContain("*");
    expect(params.get("limit")).toBe("25");
    expect(params.get("offset")).toBe("50");
    expect(params.get("and")).toContain('first_name.ilike."*Taylor,Jane)*"');
    expect(params.get("and")).toContain("status.is.null");
    expect(params.get("and")).toContain("assignedTo.is.null");
    expect(params.get("attribution->kairos_admin->>followUpAt")).toContain("lte.");
  });
  it("loads existing leads with New/Unassigned defaults and exact totals", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([row], 51));
    vi.stubGlobal("fetch", fetchMock);
    const result = await getLeadPage({ ...DEFAULT_ADMIN_FILTERS, page: 3 });
    expect(result.total).toBe(51);
    expect(result.leads[0]).toMatchObject({
      name: "Taylor Johnson",
      source: "facebook",
      status: "new",
      assignedTo: "unassigned",
    });
    const url = new URL(fetchMock.mock.calls[0]![0]);
    expect(url.searchParams.get("offset")).toBe("50");
    expect(url.searchParams.get("limit")).toBe("25");
  });
  it("preserves attribution and scopes updates by id and revision", async () => {
    const update: AdminLeadUpdate = {
      id: row.id,
      status: "contacted",
      assignedTo: "rrose@vektiss.com",
      followUpAt: null,
      notes: "Called customer",
      revision: null,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response([row]))
      .mockImplementationOnce((_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        return Promise.resolve(response([{ ...row, attribution: body.attribution }]));
      });
    vi.stubGlobal("fetch", fetchMock);
    const saved = await saveLeadManagement(update);
    expect(saved).toMatchObject({
      status: "contacted",
      assignedTo: "rrose@vektiss.com",
      notes: "Called customer",
    });
    const url = new URL(fetchMock.mock.calls[1]![0]);
    expect(url.searchParams.get("id")).toBe(`eq.${row.id}`);
    expect(url.searchParams.get("attribution->kairos_admin->>revision")).toBe("is.null");
    expect(url.searchParams.get("order")).toBe("id.asc");
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body).attribution).toMatchObject({
      utm_source: "facebook",
      utm_campaign: "test-campaign",
    });
  });
  it("rejects stale updates and a race with another admin", async () => {
    const update: AdminLeadUpdate = {
      id: row.id,
      status: "new",
      assignedTo: "unassigned",
      followUpAt: null,
      notes: "Draft",
      revision: null,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response([{ ...row, attribution: { kairos_admin: { revision: webcrypto.randomUUID() } } }]),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(saveLeadManagement(update)).rejects.toThrow("another admin");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock
      .mockReset()
      .mockResolvedValueOnce(response([row]))
      .mockResolvedValueOnce(response([]));
    await expect(saveLeadManagement(update)).rejects.toThrow("another admin");
  });
  it("escapes CSV quotes, line breaks, and spreadsheet formula prefixes", () => {
    const csv = leadsToCsv([
      { ...normalizeAdminLead(row), name: '=HYPERLINK("bad")', notes: '  @SUM(1)\n"note"' },
    ]);
    expect(csv).toContain('\'=HYPERLINK(""bad"")');
    expect(csv).toContain("'  @SUM");
    expect(csv).toContain('""note""');
  });
  it("rejects oversized exports rather than silently truncating", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([row], 10001)));
    await expect(exportLeadCsv(DEFAULT_ADMIN_FILTERS)).rejects.toThrow("10,000");
  });
  it("does not expose provider error bodies or secrets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("SECRET-DATABASE-DETAILS", { status: 500 })),
    );
    await expect(getLeadPage({ ...DEFAULT_ADMIN_FILTERS, page: 1 })).rejects.toThrow(
      "Lead storage request failed",
    );
  });
});
