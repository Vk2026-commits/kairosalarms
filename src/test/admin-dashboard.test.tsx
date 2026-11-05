import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { localDateTimeToIso, toLocalDateTime } from "@/components/admin/admin-utils";
import { DEFAULT_ADMIN_FILTERS, type AdminLead, type AdminLeadPage } from "@/lib/admin";

const api = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  listAdminLeads: vi.fn(),
  updateAdminLead: vi.fn(),
  exportAdminLeads: vi.fn(),
}));
vi.mock("@/lib/admin.functions", () => api);

class MockLogoutChannel {
  static instances: MockLogoutChannel[] = [];
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();
  constructor(public name: string) {
    MockLogoutChannel.instances.push(this);
  }
  receive(data: unknown) {
    this.onmessage?.(new MessageEvent("message", { data }));
  }
}

const signedOut = { authenticated: false, configured: true, expiresAt: null };
const signedIn = { authenticated: true, configured: true, expiresAt: Date.now() + 60 * 60 * 1000 };
const lead: AdminLead = {
  id: "test-lead-1",
  createdAt: "2026-10-30T18:00:00.000Z",
  name: "Test Customer",
  phone: "+12025550101",
  email: "customer@example.test",
  zip: "77002",
  propertyType: "home",
  exteriorDoors: "2",
  securityType: "alarm-doorbell",
  callConsent: true,
  source: "quote-diagnostic",
  status: "new",
  assignedTo: "unassigned",
  followUpAt: null,
  notes: "Original test notes",
  updatedAt: "2026-10-30T18:00:00.000Z",
  revision: "b4358050-ea37-444c-a6da-d62d08ad8f9b",
};
const page = (
  leads: AdminLead[] = [lead],
  overrides: Partial<AdminLeadPage> = {},
): AdminLeadPage => ({ leads, total: leads.length, page: 1, pageSize: 25, ...overrides });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
async function openDashboard() {
  api.getAdminSession.mockResolvedValue(signedIn);
  render(<AdminDashboard />);
  return await screen.findByRole("button", { name: "Test Customer" });
}

beforeEach(() => {
  vi.resetAllMocks();
  MockLogoutChannel.instances = [];
  vi.stubGlobal("BroadcastChannel", MockLogoutChannel);
  api.getAdminSession.mockResolvedValue(signedOut);
  api.loginAdmin.mockResolvedValue(signedIn);
  api.logoutAdmin.mockResolvedValue({ ok: true });
  api.listAdminLeads.mockResolvedValue(page());
  api.updateAdminLead.mockImplementation(async ({ data }) => ({
    ...lead,
    ...data,
    revision: "deabcb6a-5c95-4aa6-bff9-82f591a63cb2",
  }));
  api.exportAdminLeads.mockResolvedValue({
    csv: "name\r\nTest Customer\r\n",
    count: 1,
    filename: "server-provided.csv",
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("admin dashboard", () => {
  it("checks the server session and never requests leads at the passcode gate", async () => {
    const pending = deferred<typeof signedOut>();
    api.getAdminSession.mockReturnValue(pending.promise);
    render(<AdminDashboard />);
    expect(screen.getByText("Checking admin session…")).toBeInTheDocument();
    expect(api.listAdminLeads).not.toHaveBeenCalled();
    await act(async () => pending.resolve(signedOut));
    expect(await screen.findByLabelText("Admin passcode")).toHaveAttribute("type", "password");
    expect(api.listAdminLeads).not.toHaveBeenCalled();
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
  });

  it("shows one-time setup without a password input or lead requests if unconfigured", async () => {
    api.getAdminSession.mockResolvedValue({ ...signedOut, configured: false });
    render(<AdminDashboard />);
    expect(await screen.findByText("One-time server setup required")).toBeInTheDocument();
    expect(screen.getByText("KAIROS_ADMIN_PASSCODE")).toBeInTheDocument();
    expect(screen.getByText("12 characters")).toBeInTheDocument();
    expect(screen.queryByLabelText("Admin passcode")).not.toBeInTheDocument();
    expect(api.listAdminLeads).not.toHaveBeenCalled();
  });

  it("provides a retry for session-check failures, without loading customer data", async () => {
    api.getAdminSession.mockRejectedValueOnce(new Error("Session service unavailable"));
    render(<AdminDashboard />);
    fireEvent.click(await screen.findByRole("button", { name: "Retry session check" }));
    expect(await screen.findByLabelText("Admin passcode")).toBeInTheDocument();
    expect(api.getAdminSession).toHaveBeenCalledTimes(2);
    expect(api.listAdminLeads).not.toHaveBeenCalled();
  });

  it("only loads leads after successful server authentication and clears the passcode input immediately", async () => {
    const pending = deferred<typeof signedIn>();
    api.loginAdmin.mockReturnValue(pending.promise);
    render(<AdminDashboard />);
    const input = await screen.findByLabelText("Admin passcode");
    fireEvent.change(input, { target: { value: "test-only entered credential" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(input).toHaveValue("");
    expect(api.loginAdmin).toHaveBeenCalledWith({
      data: { passcode: "test-only entered credential" },
    });
    expect(api.listAdminLeads).not.toHaveBeenCalled();
    await act(async () => pending.resolve(signedIn));
    expect(await screen.findByRole("button", { name: lead.name })).toBeInTheDocument();
    expect(api.listAdminLeads).toHaveBeenCalledWith({
      data: { ...DEFAULT_ADMIN_FILTERS, page: 1 },
    });
  });

  it("submits status and notes with the selected revision and refreshes the list after saving", async () => {
    fireEvent.click(await openDashboard());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: lead.phone })).toHaveAttribute(
      "href",
      "tel:+12025550101",
    );
    fireEvent.change(within(dialog).getByLabelText("Lead status"), {
      target: { value: "contacted" },
    });
    fireEvent.change(within(dialog).getByLabelText("Internal notes"), {
      target: { value: "Called customer; requested a quote." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(api.updateAdminLead).toHaveBeenCalledWith({
        data: {
          id: lead.id,
          revision: lead.revision,
          status: "contacted",
          assignedTo: "unassigned",
          followUpAt: null,
          notes: "Called customer; requested a quote.",
        },
      }),
    );
    await waitFor(() => expect(api.listAdminLeads).toHaveBeenCalledTimes(2));
    expect(within(dialog).getByLabelText("Internal notes")).toHaveValue(
      "Called customer; requested a quote.",
    );
    expect(within(dialog).getByLabelText("Lead status")).toHaveValue("contacted");
    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("preserves unsaved notes when an optimistic update conflicts", async () => {
    api.updateAdminLead.mockRejectedValue(
      new Error("This lead was changed by another team member. Refresh before saving."),
    );
    fireEvent.click(await openDashboard());
    const dialog = await screen.findByRole("dialog");
    const notes = within(dialog).getByLabelText("Internal notes");
    fireEvent.change(notes, { target: { value: "A draft that must not be lost." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("another team member");
    expect(notes).toHaveValue("A draft that must not be lost.");
    expect(api.listAdminLeads).toHaveBeenCalledTimes(1);
  });

  it("clears customer details immediately on logout and ignores an older pending refresh", async () => {
    await openDashboard();
    const pendingList = deferred<AdminLeadPage>();
    const pendingLogout = deferred<{ ok: true }>();
    api.listAdminLeads.mockReturnValueOnce(pendingList.promise);
    api.logoutAdmin.mockReturnValue(pendingLogout.promise);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(api.listAdminLeads).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByLabelText("Admin passcode")).toBeInTheDocument();
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
    await act(async () => {
      pendingList.resolve(page());
      pendingLogout.resolve({ ok: true });
    });
    expect(screen.queryByRole("button", { name: lead.name })).not.toBeInTheDocument();
    expect(api.logoutAdmin).toHaveBeenCalledOnce();
  });

  it("broadcasts only a logout event and no customer data or credentials", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    await openDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(MockLogoutChannel.instances[0]?.name).toBe("kairos-admin-logout");
    expect(MockLogoutChannel.instances[0]?.postMessage).toHaveBeenCalledExactlyOnceWith("logout");
    expect(storage).not.toHaveBeenCalled();
    expect(await screen.findByLabelText("Admin passcode")).toBeInTheDocument();
  });

  it("clears the other tab's draft and invalidates pending list, save, and export responses on channel logout", async () => {
    await openDashboard();
    const pendingList = deferred<AdminLeadPage>();
    const pendingSave = deferred<AdminLead>();
    const pendingExport = deferred<{ csv: string; count: number; filename: string }>();
    const createUrl = vi.fn(() => "blob:must-not-download");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createUrl,
    });
    api.listAdminLeads.mockReturnValueOnce(pendingList.promise);
    api.updateAdminLead.mockReturnValueOnce(pendingSave.promise);
    api.exportAdminLeads.mockReturnValueOnce(pendingExport.promise);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: lead.name }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Internal notes"), {
      target: { value: "Sensitive unsaved draft" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(api.updateAdminLead).toHaveBeenCalledOnce();
    await act(async () => MockLogoutChannel.instances[0]?.receive("logout"));
    expect(await screen.findByLabelText("Admin passcode")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
    await act(async () => {
      pendingList.resolve(page());
      pendingSave.resolve({ ...lead, notes: "Sensitive unsaved draft" });
      pendingExport.resolve({ csv: "private data", count: 1, filename: "private.csv" });
    });
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(createUrl).not.toHaveBeenCalled();
    expect(api.listAdminLeads).toHaveBeenCalledTimes(2);
    expect(api.logoutAdmin).not.toHaveBeenCalled();
  });

  it("revalidates on focus and preserves the unsaved draft when the server session remains valid", async () => {
    fireEvent.click(await openDashboard());
    const notes = within(await screen.findByRole("dialog")).getByLabelText("Internal notes");
    fireEvent.change(notes, { target: { value: "Keep this working draft" } });
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(api.getAdminSession).toHaveBeenCalledTimes(2);
    expect(notes).toHaveValue("Keep this working draft");
    expect(api.listAdminLeads).toHaveBeenCalledTimes(1);
  });

  it("clears the lead and draft when focus verification returns an invalid session", async () => {
    fireEvent.click(await openDashboard());
    api.getAdminSession.mockResolvedValueOnce(signedOut);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(await screen.findByLabelText("Admin passcode")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your admin session has expired. Sign in again.",
    );
  });

  it("verifies a visibility resume, coalesces focus events, and fails closed on verification errors", async () => {
    await openDashboard();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const pending = deferred<typeof signedIn>();
    api.getAdminSession.mockReturnValueOnce(pending.promise);
    fireEvent(document, new Event("visibilitychange"));
    expect(api.getAdminSession).toHaveBeenCalledTimes(1);
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    fireEvent(window, new Event("focus"));
    expect(api.getAdminSession).toHaveBeenCalledTimes(2);
    await act(async () => pending.reject(new Error("Network unavailable")));
    expect(await screen.findByLabelText("Admin passcode")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to verify your admin session");
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
  });

  it("clears lead state and returns to the gate when authentication expires on a request", async () => {
    await openDashboard();
    api.listAdminLeads.mockRejectedValueOnce(
      new Error("Your admin session has expired. Sign in again."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByLabelText("Admin passcode")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your admin session has expired. Sign in again.",
    );
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
  });

  it("resets server pagination when filters change and ignores a stale response", async () => {
    api.listAdminLeads.mockResolvedValueOnce(page([lead], { page: 2, total: 60 }));
    await openDashboard();
    const stale = deferred<AdminLeadPage>();
    const latest = deferred<AdminLeadPage>();
    api.listAdminLeads.mockReturnValueOnce(stale.promise).mockReturnValueOnce(latest.promise);
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "contacted" } });
    await waitFor(() =>
      expect(api.listAdminLeads).toHaveBeenCalledWith({
        data: { ...DEFAULT_ADMIN_FILTERS, status: "contacted", page: 1 },
      }),
    );
    expect(screen.queryByRole("button", { name: lead.name })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Assignment"), { target: { value: "unassigned" } });
    await waitFor(() => expect(api.listAdminLeads).toHaveBeenCalledTimes(3));
    await act(async () => latest.resolve(page([])));
    expect(await screen.findByText("No leads match these filters")).toBeInTheDocument();
    await act(async () => stale.resolve(page()));
    expect(screen.queryByRole("button", { name: lead.name })).not.toBeInTheDocument();
  });

  it("downloads the server-provided CSV and disables repeat exports while in flight", async () => {
    const createUrl = vi.fn(() => "blob:test-export");
    const revokeUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeUrl,
    });
    let downloadName = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download;
    });
    const pending = deferred<{ csv: string; count: number; filename: string }>();
    api.exportAdminLeads.mockReturnValue(pending.promise);
    await openDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(screen.getByRole("button", { name: "Exporting…" })).toBeDisabled();
    expect(api.exportAdminLeads).toHaveBeenCalledWith({ data: DEFAULT_ADMIN_FILTERS });
    await act(async () =>
      pending.resolve({
        csv: "name\r\nTest Customer\r\n",
        count: 1,
        filename: "server-provided.csv",
      }),
    );
    expect(click).toHaveBeenCalledOnce();
    expect(downloadName).toBe("server-provided.csv");
    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeUrl).toHaveBeenCalledWith("blob:test-export");
    expect(screen.getByText("Exported 1 lead to server-provided.csv.")).toBeInTheDocument();
  });

  it("renders a genuine empty inbox rather than sample lead rows", async () => {
    api.getAdminSession.mockResolvedValue(signedIn);
    api.listAdminLeads.mockResolvedValue(page([]));
    render(<AdminDashboard />);
    expect(await screen.findByText("No leads yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(lead.email)).not.toBeInTheDocument();
  });
});

it("round-trips local follow-up wall time to an ISO UTC instant", () => {
  const value = "2026-11-05T14:30";
  const iso = localDateTimeToIso(value);
  expect(iso).toBe(new Date(2026, 10, 5, 14, 30).toISOString());
  expect(toLocalDateTime(iso)).toBe(value);
  expect(localDateTimeToIso("")).toBeNull();
  expect(() => localDateTimeToIso("not-a-date")).toThrow("valid local follow-up");
});
