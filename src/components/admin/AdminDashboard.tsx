import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDownToLine, ChevronRight, ListFilter, LogOut, RefreshCw, Search } from "lucide-react";
import {
  getAdminSession,
  loginAdmin,
  logoutAdmin,
  listAdminLeads,
  updateAdminLead,
  exportAdminLeads,
} from "@/lib/admin.functions";
import {
  DEFAULT_ADMIN_FILTERS,
  ADMIN_ASSIGNEES,
  LEAD_STATUSES,
  assigneeLabel,
  statusLabel,
  type AdminLead,
  type AdminLeadFilters,
  type AdminLeadPage,
  type AdminLeadQuery,
  type AdminLeadUpdate,
  type AdminSession,
} from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminGate } from "./AdminGate";
import { LeadDetail } from "./LeadDetail";
import { LeadTable } from "./LeadTable";
import { AdminBrand, Busy, selectClass } from "./admin-ui";
import { adminErrorMessage, isAdminAuthError } from "./admin-utils";

const EXPIRED_MESSAGE = "Your admin session has expired. Sign in again.";
const LOGOUT_CHANNEL = "kairos-admin-logout";

export function AdminDashboard() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [query, setQuery] = useState<AdminLeadQuery>({ ...DEFAULT_ADMIN_FILTERS, page: 1 });
  const [searchDraft, setSearchDraft] = useState("");
  const [data, setData] = useState<AdminLeadPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminLead | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Nothing sensitive enters a query cache or browser storage. Epochs invalidate in-flight requests.
  const authEpoch = useRef(0);
  const listEpoch = useRef(0);
  const alive = useRef(true);
  const exportInFlight = useRef(false);
  const logoutChannel = useRef<BroadcastChannel | null>(null);
  const resumeVerification = useRef(false);
  const authenticated = session?.authenticated === true;

  const clearLeads = useCallback(() => {
    listEpoch.current += 1;
    setData(null);
    setSelected(null);
    setLoading(false);
    setListError(null);
    setQuery({ ...DEFAULT_ADMIN_FILTERS, page: 1 });
    setSearchDraft("");
    setNotice(null);
    setActionError(null);
    setExporting(false);
    exportInFlight.current = false;
  }, []);

  const expireSession = useCallback(() => {
    authEpoch.current += 1;
    clearLeads();
    setSession({ authenticated: false, configured: true, expiresAt: null });
    setChecking(false);
    setAuthBusy(false);
    setLoggingOut(false);
    setAuthError(EXPIRED_MESSAGE);
  }, [clearLeads]);

  const checkSession = useCallback(async () => {
    const epoch = ++authEpoch.current;
    clearLeads();
    setSession(null);
    setChecking(true);
    setAuthError(null);
    try {
      const current = await getAdminSession();
      if (alive.current && epoch === authEpoch.current) setSession(current);
    } catch (error) {
      if (alive.current && epoch === authEpoch.current) {
        if (isAdminAuthError(error)) expireSession();
        else
          setAuthError(
            adminErrorMessage(error, "Unable to check the admin session. Please retry."),
          );
      }
    } finally {
      if (alive.current && epoch === authEpoch.current) setChecking(false);
    }
  }, [clearLeads, expireSession]);

  useEffect(() => {
    alive.current = true;
    void checkSession();
    return () => {
      alive.current = false;
      authEpoch.current += 1;
      listEpoch.current += 1;
    };
  }, [checkSession]);

  useEffect(() => {
    function receiveLogout() {
      expireSession();
      setAuthError("Signed out in another tab. Sign in again.");
    }
    function receiveStorage(event: StorageEvent) {
      if (event.key === LOGOUT_CHANNEL && event.newValue !== null) receiveLogout();
    }
    // This channel carries only a logout event, never credentials, tokens, or customer data.
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(LOGOUT_CHANNEL);
        channel.onmessage = (event: MessageEvent<unknown>) => {
          if (event.data === "logout") receiveLogout();
        };
        logoutChannel.current = channel;
      }
    } catch {
      // Restricted browser environments can use the timestamp-only storage fallback.
    }
    window.addEventListener("storage", receiveStorage);
    return () => {
      window.removeEventListener("storage", receiveStorage);
      logoutChannel.current?.close();
      logoutChannel.current = null;
    };
  }, [expireSession]);

  const verifyOnResume = useCallback(async () => {
    if (!authenticated || resumeVerification.current) return;
    resumeVerification.current = true;
    const epoch = authEpoch.current;
    try {
      const current = await getAdminSession();
      if (!alive.current || epoch !== authEpoch.current) return;
      if (!current.authenticated) {
        expireSession();
        setSession(current);
      } else {
        // A valid session leaves the current workflow and unsaved draft intact.
        setSession(current);
      }
    } catch (error) {
      if (!alive.current || epoch !== authEpoch.current) return;
      expireSession();
      if (!isAdminAuthError(error)) {
        setAuthError(
          "Unable to verify your admin session. Customer details were cleared. Sign in again.",
        );
      }
    } finally {
      resumeVerification.current = false;
    }
  }, [authenticated, expireSession]);

  useEffect(() => {
    function resume() {
      if (document.visibilityState !== "hidden") void verifyOnResume();
    }
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [verifyOnResume]);

  useEffect(() => {
    if (!authenticated || session?.expiresAt == null) return;
    const timer = window.setTimeout(
      expireSession,
      Math.max(0, Math.min(session.expiresAt - Date.now(), 2147483647)),
    );
    return () => window.clearTimeout(timer);
  }, [authenticated, session?.expiresAt, expireSession]);

  useEffect(() => {
    if (!authenticated) return;
    const epoch = ++listEpoch.current;
    const auth = authEpoch.current;
    setLoading(true);
    setListError(null);
    void listAdminLeads({ data: query })
      .then((page) => {
        if (alive.current && auth === authEpoch.current && epoch === listEpoch.current)
          setData(page);
      })
      .catch((error: unknown) => {
        if (!alive.current || auth !== authEpoch.current || epoch !== listEpoch.current) return;
        if (isAdminAuthError(error)) expireSession();
        else {
          setData(null);
          setListError(adminErrorMessage(error, "Could not load leads. Please try again."));
        }
      })
      .finally(() => {
        if (alive.current && auth === authEpoch.current && epoch === listEpoch.current)
          setLoading(false);
      });
    return () => {
      listEpoch.current += 1;
    };
  }, [authenticated, query, refresh, expireSession]);

  async function signIn(passcode: string) {
    const epoch = ++authEpoch.current;
    setAuthBusy(true);
    setAuthError(null);
    try {
      const current = await loginAdmin({ data: { passcode } });
      if (!alive.current || epoch !== authEpoch.current) return;
      setSession(current);
      if (!current.authenticated && current.configured)
        setAuthError("Sign-in was not accepted. Check the passcode and try again.");
    } catch (error) {
      if (alive.current && epoch === authEpoch.current) {
        clearLeads();
        setAuthError(adminErrorMessage(error, "Unable to sign in. Please try again."));
      }
    } finally {
      if (alive.current && epoch === authEpoch.current) setAuthBusy(false);
    }
  }

  async function signOut() {
    if (loggingOut) return;
    const epoch = ++authEpoch.current;
    try {
      if (logoutChannel.current) logoutChannel.current.postMessage("logout");
      else window.localStorage.setItem(LOGOUT_CHANNEL, String(Date.now()));
    } catch {
      // Local clearing and server logout still proceed when browser messaging is unavailable.
    }
    // Remove all customer details immediately, including before a slow logout response.
    clearLeads();
    setSession({ authenticated: false, configured: true, expiresAt: null });
    setLoggingOut(true);
    setAuthBusy(true);
    setAuthError(null);
    try {
      await logoutAdmin();
    } catch {
      if (alive.current && epoch === authEpoch.current)
        setAuthError(
          "Customer details have been cleared, but the server could not confirm sign-out. Retry sign-out before leaving a shared device.",
        );
    } finally {
      if (alive.current && epoch === authEpoch.current) {
        setLoggingOut(false);
        setAuthBusy(false);
      }
    }
  }

  function changeQuery(next: AdminLeadQuery) {
    listEpoch.current += 1;
    setData(null);
    setLoading(true);
    setListError(null);
    setNotice(null);
    setActionError(null);
    setQuery(next);
  }
  function changeFilters(filters: Partial<AdminLeadFilters>) {
    changeQuery({ ...query, ...filters, page: 1 });
  }
  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    changeFilters({ search: searchDraft.trim().slice(0, 80) });
  }
  function resetFilters() {
    setSearchDraft("");
    changeQuery({ ...DEFAULT_ADMIN_FILTERS, page: 1 });
  }
  function refreshLeads() {
    setNotice(null);
    setActionError(null);
    setRefresh((value) => value + 1);
  }

  async function saveLead(update: AdminLeadUpdate) {
    const epoch = authEpoch.current;
    try {
      const updated = await updateAdminLead({ data: update });
      if (!alive.current || epoch !== authEpoch.current) return;
      setSelected(updated);
      setNotice("Lead changes saved.");
      setRefresh((value) => value + 1);
    } catch (error) {
      if (alive.current && epoch === authEpoch.current && isAdminAuthError(error)) expireSession();
      throw error;
    }
  }

  async function downloadCsv() {
    if (exportInFlight.current || !authenticated) return;
    exportInFlight.current = true;
    const epoch = authEpoch.current;
    setExporting(true);
    setActionError(null);
    setNotice(null);
    try {
      const { search, status, assignedTo, dueOnly } = query;
      const result = await exportAdminLeads({ data: { search, status, assignedTo, dueOnly } });
      if (!alive.current || epoch !== authEpoch.current) return;
      const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8;" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        URL.revokeObjectURL(url);
      }
      setNotice(
        `Exported ${result.count.toLocaleString()} ${result.count === 1 ? "lead" : "leads"} to ${result.filename}.`,
      );
    } catch (error) {
      if (!alive.current || epoch !== authEpoch.current) return;
      if (isAdminAuthError(error)) expireSession();
      else setActionError(adminErrorMessage(error, "Unable to export leads. Please try again."));
    } finally {
      if (alive.current && epoch === authEpoch.current) {
        setExporting(false);
        exportInFlight.current = false;
      }
    }
  }

  if (!authenticated)
    return (
      <>
        <AdminGate
          checking={checking}
          configured={session?.configured ?? null}
          error={authError}
          busy={authBusy}
          onLogin={signIn}
          onRetry={() => {
            void checkSession();
          }}
        />
        {authError?.includes("Retry sign-out") && (
          <div className="fixed inset-x-0 bottom-4 flex justify-center">
            <Button
              type="button"
              onClick={() => {
                void signOut();
              }}
              disabled={loggingOut}
            >
              Retry sign-out
            </Button>
          </div>
        )}
      </>
    );

  const filtered =
    query.search !== "" || query.status !== "all" || query.assignedTo !== "all" || query.dueOnly;
  const pageLeads = data?.leads ?? [];
  const dueOnPage = pageLeads.filter(
    (lead) =>
      lead.followUpAt &&
      new Date(lead.followUpAt).getTime() <= Date.now() &&
      !["won", "lost"].includes(lead.status),
  ).length;
  const stats = [
    { label: "Matching leads", value: data?.total, detail: "Across all result pages" },
    {
      label: "New on this page",
      value: data ? pageLeads.filter((lead) => lead.status === "new").length : undefined,
      detail: "Current page only",
    },
    {
      label: "Due on this page",
      value: data ? dueOnPage : undefined,
      detail: "Open leads · local time",
    },
    {
      label: "Unassigned on this page",
      value: data ? pageLeads.filter((lead) => lead.assignedTo === "unassigned").length : undefined,
      detail: "Current page only",
    },
  ];
  return (
    <div className="min-h-svh bg-[#f7f4ed] text-foreground">
      <header className="border-b border-gold-soft/20 bg-burgundy-deep text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <AdminBrand />
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-white/65 sm:inline">Private admin workspace</span>
            <Button
              type="button"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                void signOut();
              }}
              disabled={loggingOut}
            >
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#83715a]">
              Operations <ChevronRight className="size-3" aria-hidden="true" />
              Lead management
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Every inquiry. A clear next step.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Review submitted security inquiries, coordinate ownership, and keep follow-ups moving.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 bg-white"
              disabled={loading}
              onClick={refreshLeads}
            >
              <RefreshCw
                className={loading ? "animate-spin motion-reduce:animate-none" : ""}
                aria-hidden="true"
              />
              Refresh
            </Button>
            <Button
              type="button"
              className="h-10"
              disabled={exporting || loading}
              onClick={() => {
                void downloadCsv();
              }}
            >
              {exporting ? (
                <Busy>Exporting…</Busy>
              ) : (
                <>
                  <ArrowDownToLine aria-hidden="true" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>
        {notice && (
          <p
            role="status"
            className="mb-5 rounded-lg border border-[#c4d8c9] bg-[#edf5ee] px-4 py-3 text-sm text-[#315a3b]"
          >
            {notice}
          </p>
        )}
        {actionError && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {actionError}
          </p>
        )}
        <section
          aria-label="Lead counts"
          className="mb-6 grid grid-cols-2 overflow-hidden rounded-xl border border-[#e4ddd1] bg-white lg:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-5 py-5 sm:px-6 ${index > 0 ? "border-l border-[#e4ddd1]" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""}`}
            >
              <p className="text-xs font-medium text-[#746958]">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-primary">
                {stat.value?.toLocaleString() ?? "—"}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">{stat.detail}</p>
            </div>
          ))}
        </section>
        <section
          aria-labelledby="lead-filter-heading"
          className="mb-6 rounded-xl border border-[#e4ddd1] bg-white p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="lead-filter-heading" className="flex items-center gap-2 text-sm font-semibold">
              <ListFilter className="size-4 text-[#8b704c]" aria-hidden="true" />
              Find the right leads
            </h2>
            {filtered && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.5fr)_1fr_1fr_auto]">
            <form onSubmit={applySearch} className="space-y-2">
              <Label htmlFor="lead-search">Search leads</Label>
              <div className="flex gap-2">
                <Input
                  id="lead-search"
                  type="search"
                  value={searchDraft}
                  maxLength={80}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Name, email, phone, or ZIP"
                  className="h-10 min-w-0 bg-white"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className="size-10 shrink-0"
                  aria-label="Apply search"
                >
                  <Search aria-hidden="true" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Press Enter to apply · 80 characters maximum
              </p>
            </form>
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <select
                id="filter-status"
                value={query.status}
                className={selectClass}
                onChange={(event) =>
                  changeFilters({ status: event.target.value as AdminLeadFilters["status"] })
                }
              >
                <option value="all">All statuses</option>
                {LEAD_STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-assignee">Assignment</Label>
              <select
                id="filter-assignee"
                value={query.assignedTo}
                className={selectClass}
                onChange={(event) =>
                  changeFilters({
                    assignedTo: event.target.value as AdminLeadFilters["assignedTo"],
                  })
                }
              >
                <option value="all">All assignments</option>
                {ADMIN_ASSIGNEES.map((assignee) => (
                  <option value={assignee} key={assignee}>
                    {assigneeLabel(assignee)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-start pt-2 xl:pt-8">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-primary"
                  checked={query.dueOnly}
                  onChange={(event) => changeFilters({ dueOnly: event.target.checked })}
                />
                Due follow-ups only
              </label>
            </div>
          </div>
          {query.search && (
            <p className="mt-3 break-words text-xs text-muted-foreground">
              Applied search: “{query.search}”
            </p>
          )}
        </section>
        <LeadTable
          data={data}
          loading={loading}
          error={listError}
          filtered={filtered}
          onSelect={setSelected}
          onReset={resetFilters}
          onRetry={refreshLeads}
          onPage={(page) => changeQuery({ ...query, page })}
        />
        <footer className="mt-6 flex flex-wrap justify-between gap-2 pb-3 text-[11px] text-muted-foreground">
          <p>Authorized team access · Customer data stays in this workspace.</p>
          <p>CSV exports include all matching leads, not just this page.</p>
        </footer>
      </main>
      {selected && (
        <LeadDetail
          key={selected.id}
          lead={selected}
          onClose={() => setSelected(null)}
          onSave={saveLead}
        />
      )}
    </div>
  );
}
