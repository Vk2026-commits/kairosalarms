import {
  ADMIN_ASSIGNEES,
  LEAD_STATUSES,
  assigneeLabel,
  securityLabel,
  statusLabel,
  type AdminLead,
  type AdminLeadFilters,
  type AdminLeadPage,
  type AdminLeadQuery,
  type AdminLeadUpdate,
} from "./admin";

export const ADMIN_PAGE_SIZE = 25;
const EXPORT_LIMIT = 10_000;
const SELECT_COLUMNS =
  "id,created_at,first_name,phone,email,zip,call_consent,property_type,exterior_doors,security_type,attribution";
const META_PREFIX = "attribution->kairos_admin->>";

type RawLead = {
  id: string | number;
  created_at?: string | null;
  first_name?: string | null;
  phone?: string | null;
  email?: string | null;
  zip?: string | null;
  call_consent?: boolean | null;
  property_type?: string | null;
  exterior_doors?: string | null;
  security_type?: string | null;
  attribution?: unknown;
};
type Metadata = {
  status?: string;
  assignedTo?: string;
  followUpAt?: string | null;
  notes?: string;
  updatedAt?: string;
  revision?: string;
};

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function metadata(row: RawLead): Metadata {
  return object(object(row.attribution)["kairos_admin"]) as Metadata;
}
export function normalizeAdminLead(row: RawLead): AdminLead {
  const meta = metadata(row);
  const attribution = object(row.attribution);
  const source =
    typeof attribution["utm_source"] === "string"
      ? attribution["utm_source"]
      : "Direct / not recorded";
  return {
    id: String(row.id),
    createdAt: row.created_at ?? null,
    name: row.first_name ?? "Unnamed lead",
    phone: row.phone ?? "",
    email: row.email ?? "",
    zip: row.zip ?? "",
    propertyType: row.property_type ?? null,
    exteriorDoors: row.exterior_doors ?? null,
    securityType: row.security_type ?? null,
    callConsent: row.call_consent === true,
    source,
    status: LEAD_STATUSES.includes(meta.status as AdminLead["status"])
      ? (meta.status as AdminLead["status"])
      : "new",
    assignedTo: ADMIN_ASSIGNEES.includes(meta.assignedTo as AdminLead["assignedTo"])
      ? (meta.assignedTo as AdminLead["assignedTo"])
      : "unassigned",
    followUpAt: typeof meta.followUpAt === "string" ? meta.followUpAt : null,
    notes: typeof meta.notes === "string" ? meta.notes : "",
    updatedAt: typeof meta.updatedAt === "string" ? meta.updatedAt : null,
    revision: typeof meta.revision === "string" ? meta.revision : null,
  };
}

function database(): { url: string; key: string } {
  const url = process.env["KAIROS_SUPABASE_URL"]?.trim();
  const key = process.env["KAIROS_SUPABASE_SERVICE_KEY"]?.trim();
  if (!url || !key)
    throw new Error(
      "Lead storage is not configured. Set KAIROS_SUPABASE_URL and KAIROS_SUPABASE_SERVICE_KEY in the server secrets.",
    );
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("The Supabase database URL must use HTTPS.");
  return { url: `${parsed.origin}/rest/v1/leads`, key };
}

export function buildAdminLeadParams(
  filters: AdminLeadFilters,
  limit: number,
  offset: number,
  now = new Date(),
): URLSearchParams {
  const params = new URLSearchParams({
    select: SELECT_COLUMNS,
    order: "created_at.desc,id.desc",
    limit: String(limit),
    offset: String(offset),
  });
  const clauses: string[] = [];
  if (filters.search.trim()) {
    // Quote the grammar value and discard wildcards/control characters. URLSearchParams handles URL encoding.
    const search = filters.search
      .trim()
      .split("")
      .filter(
        (character) => character.charCodeAt(0) >= 32 && !["\\", '"', "%", "*"].includes(character),
      )
      .join("")
      .slice(0, 80);
    if (search)
      clauses.push(
        `or(first_name.ilike."*${search}*",email.ilike."*${search}*",phone.ilike."*${search}*",zip.ilike."*${search}*")`,
      );
  }
  if (filters.status === "new")
    clauses.push(`or(${META_PREFIX}status.is.null,${META_PREFIX}status.eq.new)`);
  else if (filters.status !== "all") params.set(`${META_PREFIX}status`, `eq.${filters.status}`);
  if (filters.assignedTo === "unassigned")
    clauses.push(`or(${META_PREFIX}assignedTo.is.null,${META_PREFIX}assignedTo.eq.unassigned)`);
  else if (filters.assignedTo !== "all")
    params.set(`${META_PREFIX}assignedTo`, `eq.${filters.assignedTo}`);
  if (filters.dueOnly) {
    params.set(`${META_PREFIX}followUpAt`, `lte.${now.toISOString()}`);
    clauses.push(`or(${META_PREFIX}status.is.null,${META_PREFIX}status.not.in.(won,lost))`);
  }
  if (clauses.length) params.set("and", `(${clauses.join(",")})`);
  return params;
}

async function requestLeads(params: URLSearchParams, options: RequestInit = {}): Promise<Response> {
  const { url, key } = database();
  let response: Response;
  try {
    response = await fetch(`${url}?${params}`, {
      ...options,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not reach lead storage. Please retry.");
  }
  if (!response.ok) {
    // Never relay database/provider response bodies or service credentials to clients.
    throw new Error(
      "Lead storage request failed. Check the server connection and the leads table fields (including id, created_at, and attribution).",
    );
  }
  return response;
}

async function loadPage(
  filters: AdminLeadFilters,
  limit: number,
  offset: number,
  now?: Date,
): Promise<{ rows: RawLead[]; total: number }> {
  const response = await requestLeads(buildAdminLeadParams(filters, limit, offset, now), {
    headers: { Prefer: "count=exact" },
  });
  const rows = (await response.json()) as RawLead[];
  if (!Array.isArray(rows)) throw new Error("Lead storage returned an unexpected response.");
  const totalText = response.headers.get("content-range")?.split("/").at(-1);
  const total = totalText && /^\d+$/.test(totalText) ? Number(totalText) : offset + rows.length;
  return { rows, total };
}

export async function getLeadPage(query: AdminLeadQuery): Promise<AdminLeadPage> {
  const { rows, total } = await loadPage(
    query,
    ADMIN_PAGE_SIZE,
    (query.page - 1) * ADMIN_PAGE_SIZE,
  );
  return {
    leads: rows.map(normalizeAdminLead),
    total,
    page: query.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
}

export async function saveLeadManagement(update: AdminLeadUpdate): Promise<AdminLead> {
  const params = new URLSearchParams({ select: SELECT_COLUMNS, id: `eq.${update.id}`, limit: "1" });
  const response = await requestLeads(params);
  const rows = (await response.json()) as RawLead[];
  const row = Array.isArray(rows) ? rows[0] : undefined;
  if (!row) throw new Error("This lead no longer exists. Refresh the list.");
  const existing = normalizeAdminLead(row);
  if (existing.revision !== update.revision)
    throw new Error(
      "This lead was changed by another admin. Refresh the lead before saving; keep a copy of your notes.",
    );
  const nextAttribution = {
    ...object(row.attribution),
    kairos_admin: {
      status: update.status,
      assignedTo: update.assignedTo,
      followUpAt: update.followUpAt ? new Date(update.followUpAt).toISOString() : null,
      notes: update.notes,
      updatedAt: new Date().toISOString(),
      revision: crypto.randomUUID(),
    },
  };
  params.set(`${META_PREFIX}revision`, update.revision ? `eq.${update.revision}` : "is.null");
  // PostgREST requires a unique order for bounded PATCH operations.
  params.set("order", "id.asc");
  const saved = await requestLeads(params, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ attribution: nextAttribution }),
  });
  const savedRows = (await saved.json()) as RawLead[];
  const savedRow = Array.isArray(savedRows) ? savedRows[0] : undefined;
  if (!savedRow || savedRows.length !== 1)
    throw new Error(
      "This lead was changed by another admin. Refresh the lead before saving; keep a copy of your notes.",
    );
  return normalizeAdminLead(savedRow);
}

function csvCell(value: unknown): string {
  let text = String(value ?? "");
  // Spreadsheet-safe for Excel/Sheets, including hidden whitespace before a formula prefix.
  if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function leadsToCsv(leads: AdminLead[]): string {
  const rows: unknown[][] = [
    [
      "Name",
      "Phone",
      "Email",
      "ZIP",
      "Submitted at",
      "Status",
      "Assigned to",
      "Follow-up at",
      "Notes",
      "Property",
      "Exterior doors",
      "Security options",
      "Contact consent",
      "Source",
    ],
  ];
  for (const lead of leads)
    rows.push([
      lead.name,
      lead.phone,
      lead.email,
      lead.zip,
      lead.createdAt,
      statusLabel(lead.status),
      assigneeLabel(lead.assignedTo),
      lead.followUpAt,
      lead.notes,
      lead.propertyType,
      lead.exteriorDoors,
      securityLabel(lead.securityType),
      lead.callConsent ? "Yes" : "No",
      lead.source,
    ]);
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

export async function exportLeadCsv(
  filters: AdminLeadFilters,
): Promise<{ csv: string; count: number; filename: string }> {
  const leads: AdminLead[] = [];
  const now = new Date();
  for (let offset = 0; offset <= EXPORT_LIMIT; offset += 200) {
    const { rows, total } = await loadPage(filters, 200, offset, now);
    if (total > EXPORT_LIMIT || leads.length + rows.length > EXPORT_LIMIT)
      throw new Error("Exports are limited to 10,000 leads. Narrow the filters and try again.");
    leads.push(...rows.map(normalizeAdminLead));
    if (rows.length < 200 || leads.length >= total)
      return {
        csv: leadsToCsv(leads),
        count: leads.length,
        filename: `kairos-leads-${now.toISOString().slice(0, 10)}.csv`,
      };
  }
  throw new Error("Exports are limited to 10,000 leads. Narrow the filters and try again.");
}
