import type { ReactNode } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { statusLabel, type LeadStatus } from "@/lib/admin";

export const selectClass =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";

export function AdminBrand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-gold-soft/30 bg-white/5 text-gold-soft">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-base font-semibold tracking-tight">Kairos Security</p>
        <p className="mt-0.5 text-[11px] tracking-wide text-white/75">Total Home Protection Plan</p>
      </div>
    </div>
  );
}

export function Busy({ children }: { children: ReactNode }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm">
      <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    new: "border-[#dec29a] bg-[#fcf2df] text-[#76501c]",
    contacted: "border-[#d9dce5] bg-[#f0f2f7] text-[#44516c]",
    "follow-up": "border-[#dfc5ce] bg-[#f8edf1] text-[#772c46]",
    won: "border-[#c4d8c9] bg-[#edf5ee] text-[#315a3b]",
    lost: "border-[#ddd8d3] bg-[#f4f2f0] text-[#60584f]",
  };
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
