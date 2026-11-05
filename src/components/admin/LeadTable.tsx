import { ArrowUpRight, CalendarClock, Inbox, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assigneeLabel, type AdminLead, type AdminLeadPage } from "@/lib/admin";
import { Busy, StatusBadge } from "./admin-ui";
import { formatAdminDate } from "./admin-utils";

export function LeadTable({
  data,
  loading,
  error,
  filtered,
  onSelect,
  onReset,
  onRetry,
  onPage,
}: {
  data: AdminLeadPage | null;
  loading: boolean;
  error: string | null;
  filtered: boolean;
  onSelect: (lead: AdminLead) => void;
  onReset: () => void;
  onRetry: () => void;
  onPage: (page: number) => void;
}) {
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <section
      className="overflow-hidden rounded-xl border border-[#e4ddd1] bg-white shadow-sm"
      aria-labelledby="lead-list-heading"
      aria-busy={loading}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
        <div>
          <h2 id="lead-list-heading" tabIndex={-1} className="text-base font-semibold">
            Lead inbox
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {data
              ? `${data.total.toLocaleString()} ${filtered ? "matching" : "submitted"} ${data.total === 1 ? "inquiry" : "inquiries"}`
              : "Submitted customer inquiries"}
          </p>
        </div>
        {loading && <Busy>{data ? "Refreshing…" : "Loading leads…"}</Busy>}
      </div>
      {error ? (
        <div className="space-y-4 p-6">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button type="button" variant="outline" onClick={onRetry} disabled={loading}>
            Retry loading leads
          </Button>
        </div>
      ) : !data ? (
        <div className="flex min-h-56 items-center justify-center text-muted-foreground">
          <Busy>Loading leads…</Busy>
        </div>
      ) : data.leads.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-4 rounded-full bg-[#f7f4ed] p-4 text-[#92754d]">
            <Inbox className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-semibold">
            {filtered ? "No leads match these filters" : "No leads yet"}
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {filtered
              ? "Try a different search or reset the filters to see all submitted inquiries."
              : "New inquiries will appear here once a customer submits the security diagnostic."}
          </p>
          {filtered && (
            <Button type="button" className="mt-5" variant="outline" onClick={onReset}>
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">
              Customer leads, page {data.page} of {pages}. Open a lead to review details and edit
              its workflow.
            </caption>
            <thead className="border-b border-border bg-[#faf8f4] text-[11px] font-medium uppercase tracking-wider text-[#7b7062]">
              <tr>
                <th scope="col" className="px-5 py-3 sm:px-6">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Assigned to
                </th>
                <th scope="col" className="px-4 py-3">
                  Follow-up
                </th>
                <th scope="col" className="px-4 py-3">
                  Received
                </th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#faf8f4]">
                  <th scope="row" className="max-w-64 px-5 py-4 font-normal sm:px-6">
                    <button
                      type="button"
                      onClick={() => onSelect(lead)}
                      className="max-w-full cursor-pointer break-words rounded text-left font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {lead.name || "Unnamed inquiry"}
                    </button>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden="true" />
                        {lead.phone}
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">No phone provided</p>
                    )}
                    {lead.email && (
                      <p className="mt-1 break-all text-xs text-muted-foreground">{lead.email}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      ZIP {lead.zip || "not provided"}
                    </p>
                  </th>
                  <td className="px-4 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-4 text-xs">{assigneeLabel(lead.assignedTo)}</td>
                  <td className="px-4 py-4 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      {lead.followUpAt && (
                        <CalendarClock
                          className="size-3.5 shrink-0 text-[#8b704c]"
                          aria-hidden="true"
                        />
                      )}
                      {formatAdminDate(lead.followUpAt, true)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {formatAdminDate(lead.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Open lead ${lead.name || "Unnamed inquiry"}`}
                      onClick={() => onSelect(lead)}
                    >
                      <ArrowUpRight aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-muted-foreground sm:px-6">
          <p>
            {data.leads.length
              ? `${(data.page - 1) * data.pageSize + 1}–${(data.page - 1) * data.pageSize + data.leads.length}`
              : "0"}{" "}
            of {data.total.toLocaleString()} · Page {data.page} of {pages}
          </p>
          <nav aria-label="Lead pagination" className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || data.page <= 1}
              onClick={() => onPage(data.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || data.page >= pages}
              onClick={() => onPage(data.page + 1)}
            >
              Next
            </Button>
          </nav>
        </div>
      )}
    </section>
  );
}
