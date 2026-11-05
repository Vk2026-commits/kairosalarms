import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Mail, Phone, Save } from "lucide-react";
import {
  ADMIN_ASSIGNEES,
  LEAD_STATUSES,
  assigneeLabel,
  securityLabel,
  statusLabel,
  type AdminLead,
  type AdminLeadUpdate,
  type AdminAssignee,
  type LeadStatus,
} from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Busy, selectClass, StatusBadge } from "./admin-ui";
import {
  adminErrorMessage,
  emailHref,
  formatAdminDate,
  localDateTimeToIso,
  phoneHref,
  toLocalDateTime,
} from "./admin-utils";

function draftFromLead(lead: AdminLead) {
  return {
    status: lead.status,
    assignedTo: lead.assignedTo,
    followUpLocal: toLocalDateTime(lead.followUpAt),
    notes: lead.notes,
  };
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

export function LeadDetail({
  lead,
  onClose,
  onSave,
}: {
  lead: AdminLead;
  onClose: () => void;
  onSave: (data: AdminLeadUpdate) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => draftFromLead(lead));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const baseline = draftFromLead(lead);
  const dirty =
    draft.status !== baseline.status ||
    draft.assignedTo !== baseline.assignedTo ||
    draft.followUpLocal !== baseline.followUpLocal ||
    draft.notes !== baseline.notes;
  useEffect(() => {
    setDraft(draftFromLead(lead));
    setError(null);
    setConfirmDiscard(false);
  }, [lead]);

  function requestClose() {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);
    try {
      if (draft.notes.length > 10000)
        throw new Error("Notes must contain no more than 10,000 characters.");
      // Preserve the original instant if the operator did not edit the minute-resolution control.
      const followUpAt =
        draft.followUpLocal === baseline.followUpLocal
          ? lead.followUpAt
          : localDateTimeToIso(draft.followUpLocal);
      setSaving(true);
      await onSave({
        id: lead.id,
        revision: lead.revision,
        status: draft.status,
        assignedTo: draft.assignedTo,
        followUpAt,
        notes: draft.notes,
      });
    } catch (cause) {
      setError(
        adminErrorMessage(
          cause,
          "Could not save this lead. Your draft has been preserved. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  const telephone = phoneHref(lead.phone);
  const email = emailHref(lead.email);
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 overflow-y-auto bg-[#faf8f4] p-0 sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("lead-list-heading")?.focus();
        }}
      >
        <SheetHeader className="border-b border-[#e4ddd1] bg-white px-6 pt-8 pb-6 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b704c]">
            Customer inquiry
          </p>
          <SheetTitle className="pr-6 text-2xl">{lead.name || "Unnamed inquiry"}</SheetTitle>
          <SheetDescription>
            Received {formatAdminDate(lead.createdAt, true)}. Review the submission and manage the
            next step.
          </SheetDescription>
          <div className="pt-2">
            <StatusBadge status={lead.status} />
          </div>
        </SheetHeader>
        <div className="space-y-7 px-6 py-6">
          {confirmDiscard && (
            <div
              role="alert"
              className="space-y-3 rounded-lg border border-[#dec29a] bg-[#fcf2df] p-4 text-sm"
            >
              <p className="font-medium">You have unsaved changes.</p>
              <p>Keep editing, or discard your draft before closing.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDiscard(false)}
                >
                  Keep editing
                </Button>
                <Button type="button" size="sm" onClick={onClose}>
                  Discard changes
                </Button>
              </div>
            </div>
          )}
          <section aria-labelledby="lead-contact-heading">
            <h3 id="lead-contact-heading" className="mb-3 text-sm font-semibold">
              Contact details
            </h3>
            <div className="space-y-3 rounded-lg border border-border bg-white p-4 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-[#8b704c]" aria-hidden="true" />
                {telephone ? (
                  <a
                    className="break-all text-primary underline underline-offset-4"
                    href={telephone}
                  >
                    {lead.phone}
                  </a>
                ) : (
                  <span className="break-all">{lead.phone || "Phone not provided"}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-[#8b704c]" aria-hidden="true" />
                {email ? (
                  <a className="break-all text-primary underline underline-offset-4" href={email}>
                    {lead.email}
                  </a>
                ) : (
                  <span className="break-all">{lead.email || "Email not provided"}</span>
                )}
              </div>
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                {lead.callConsent
                  ? "Consent to contact: provided"
                  : "Consent to contact: not provided"}
                . Review consent before outreach.
              </p>
            </div>
          </section>
          <section aria-labelledby="lead-property-heading">
            <h3 id="lead-property-heading" className="mb-3 text-sm font-semibold">
              Submitted details
            </h3>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-lg border border-border bg-white p-4">
              <DetailItem label="ZIP code">{lead.zip || "Not provided"}</DetailItem>
              <DetailItem label="Property">
                {lead.propertyType === "home"
                  ? "Home"
                  : lead.propertyType === "business"
                    ? "Business"
                    : lead.propertyType || "Not provided"}
              </DetailItem>
              <DetailItem label="Exterior doors">{lead.exteriorDoors || "Not provided"}</DetailItem>
              <DetailItem label="Security preference">
                {securityLabel(lead.securityType)}
              </DetailItem>
              <div className="col-span-2">
                <DetailItem label="Source">{lead.source || "Not provided"}</DetailItem>
              </div>
            </dl>
          </section>
          <form onSubmit={save} className="space-y-5" aria-label="Lead workflow">
            <h3 className="text-sm font-semibold">Manage lead</h3>
            {error && (
              <div
                role="alert"
                className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
              >
                <p>{error}</p>
                <p className="text-foreground">
                  Your unsaved draft is still here. If another team member changed this lead, copy
                  your notes before discarding the draft, then refresh and reopen the lead to review
                  the latest saved version.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-status">Lead status</Label>
                <select
                  id="lead-status"
                  className={selectClass}
                  value={draft.status}
                  disabled={saving}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as LeadStatus })
                  }
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-assignee">Assigned to</Label>
                <select
                  id="lead-assignee"
                  className={selectClass}
                  value={draft.assignedTo}
                  disabled={saving}
                  onChange={(event) =>
                    setDraft({ ...draft, assignedTo: event.target.value as AdminAssignee })
                  }
                >
                  {ADMIN_ASSIGNEES.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assigneeLabel(assignee)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-follow-up">Follow-up date and time</Label>
              <Input
                id="lead-follow-up"
                type="datetime-local"
                className="h-10 bg-white"
                value={draft.followUpLocal}
                disabled={saving}
                aria-describedby="follow-up-help"
                onChange={(event) => setDraft({ ...draft, followUpLocal: event.target.value })}
              />
              <p id="follow-up-help" className="text-xs text-muted-foreground">
                Your local time ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Leave blank
                for no scheduled follow-up.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-notes">Internal notes</Label>
              <Textarea
                id="lead-notes"
                value={draft.notes}
                maxLength={10000}
                rows={7}
                disabled={saving}
                className="resize-y bg-white"
                placeholder="Record contact attempts, preferences, and the next step."
                aria-describedby="lead-notes-help"
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              />
              <p id="lead-notes-help" className="text-xs text-muted-foreground">
                {draft.notes.length.toLocaleString()} / 10,000 characters · Team-only notes
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <p className="text-xs text-muted-foreground">
                {dirty ? "Unsaved changes" : "No unsaved changes"}
              </p>
              <Button type="submit" className="h-10" disabled={saving || !dirty}>
                {saving ? (
                  <Busy>Saving…</Busy>
                ) : (
                  <>
                    <Save aria-hidden="true" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
            <p className="pb-3 text-xs text-muted-foreground">
              Last updated {formatAdminDate(lead.updatedAt, true)}
            </p>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
