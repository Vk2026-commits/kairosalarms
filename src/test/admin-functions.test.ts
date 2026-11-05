import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ADMIN_FILTERS } from "@/lib/admin";

const cookies = new Map<string, string>();
const request = {
  origin: "https://alarms.kairossecurity.com",
  headerOrigin: "https://alarms.kairossecurity.com",
  ip: "",
};
const cookieWrite = vi.fn();
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate: ((data: unknown) => unknown) | undefined;
    const builder = {
      inputValidator: (validator: (data: unknown) => unknown) => {
        validate = validator;
        return builder;
      },
      handler:
        (fn: (context: { data: unknown }) => unknown) => async (options?: { data?: unknown }) =>
          fn({ data: validate ? validate(options?.data) : undefined }),
    };
    return builder;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestUrl: () => new URL(request.origin),
  getRequestHeader: (name: string) =>
    name === "origin" ? request.headerOrigin : name === "cf-connecting-ip" ? request.ip : undefined,
  getRequestIP: () => request.ip,
  getCookie: (name: string) => cookies.get(name),
  setCookie: (name: string, value: string, options: unknown) => {
    cookies.set(name, value);
    cookieWrite(name, value, options);
  },
  deleteCookie: (name: string) => cookies.delete(name),
  setResponseHeader: vi.fn(),
}));
vi.mock("@/lib/lead-notification", () => ({ sendLeadEmails: vi.fn().mockResolvedValue({}) }));

import {
  exportAdminLeads,
  getAdminSession,
  listAdminLeads,
  loginAdmin,
  logoutAdmin,
  updateAdminLead,
} from "@/lib/admin.functions";
import { saveLead } from "@/lib/leads.functions";

const passcode = "test-admin-functions-passcode-12345";
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  cookies.clear();
  cookieWrite.mockClear();
  request.headerOrigin = request.origin;
  request.ip = webcrypto.randomUUID();
  process.env["KAIROS_ADMIN_PASSCODE"] = passcode;
  process.env["KAIROS_SUPABASE_URL"] = "https://database.example.com";
  process.env["KAIROS_SUPABASE_SERVICE_KEY"] = "test-secret";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env["KAIROS_ADMIN_PASSCODE"];
  delete process.env["KAIROS_SUPABASE_URL"];
  delete process.env["KAIROS_SUPABASE_SERVICE_KEY"];
});

describe("Private admin endpoints", () => {
  it("denies every lead endpoint before any database request when logged out", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(listAdminLeads({ data: { ...DEFAULT_ADMIN_FILTERS, page: 1 } })).rejects.toThrow(
      "Sign in again",
    );
    await expect(exportAdminLeads({ data: DEFAULT_ADMIN_FILTERS })).rejects.toThrow(
      "Sign in again",
    );
    await expect(
      updateAdminLead({
        data: {
          id: "lead-1",
          status: "new",
          assignedTo: "unassigned",
          notes: "",
          followUpAt: null,
          revision: null,
        },
      }),
    ).rejects.toThrow("Sign in again");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("reports configured state without disclosing a passcode", async () => {
    const session = await getAdminSession();
    expect(session).toEqual({ authenticated: false, configured: true, expiresAt: null });
    expect(JSON.stringify(session)).not.toContain(passcode);
    delete process.env["KAIROS_ADMIN_PASSCODE"];
    expect(await getAdminSession()).toEqual({
      authenticated: false,
      configured: true,
      expiresAt: null,
    });
    delete process.env["KAIROS_SUPABASE_SERVICE_KEY"];
    expect(await getAdminSession()).toEqual({
      authenticated: false,
      configured: false,
      expiresAt: null,
    });
  });
  it("rejects wrong passcodes and creates secure HttpOnly cookies after correct login", async () => {
    await expect(loginAdmin({ data: { passcode: "incorrect" } })).rejects.toThrow(
      "Incorrect passcode",
    );
    expect(cookieWrite).not.toHaveBeenCalled();
    expect(await loginAdmin({ data: { passcode } })).toMatchObject({
      authenticated: true,
      configured: true,
    });
    expect(cookieWrite).toHaveBeenCalledWith(
      "__Host-kairos_admin",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 28800,
      }),
    );
    expect((await getAdminSession()).authenticated).toBe(true);
    await logoutAdmin();
    expect((await getAdminSession()).authenticated).toBe(false);
  });
  it("rejects cross-origin login, update, and logout", async () => {
    request.headerOrigin = "https://attacker.example";
    await expect(loginAdmin({ data: { passcode } })).rejects.toThrow("admin page");
    await expect(logoutAdmin()).rejects.toThrow("admin page");
    await expect(
      updateAdminLead({
        data: {
          id: "lead-1",
          status: "new",
          assignedTo: "unassigned",
          notes: "",
          followUpAt: null,
          revision: null,
        },
      }),
    ).rejects.toThrow("admin page");
  });
  it("returns real paginated database leads only after login", async () => {
    await loginAdmin({ data: { passcode } });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify([{ id: "lead-1", first_name: "Alex Customer", attribution: null }]),
          { status: 200, headers: { "content-range": "0-0/1" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await listAdminLeads({ data: { ...DEFAULT_ADMIN_FILTERS, page: 1 } });
    expect(result.leads[0]?.name).toBe("Alex Customer");
    expect(result.total).toBe(1);
  });
});

it("strips privileged CRM metadata from unauthenticated public signup attribution", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  await saveLead({
    data: {
      submissionId: webcrypto.randomUUID(),
      firstName: "Alex",
      lastName: "Customer",
      email: "alex@example.com",
      phone: "2815550123",
      zip: "77002",
      callConsent: true,
      attribution: { utm_source: "facebook", kairos_admin: { status: "won", notes: "forged" } },
    },
  });
  const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
  expect(body.attribution).toEqual({ utm_source: "facebook" });
});
