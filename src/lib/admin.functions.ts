import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_ASSIGNEES, LEAD_STATUSES } from "./admin";
import {
  assertAdminSameOrigin,
  clearAdminSession,
  consumeAdminLoginAttempt,
  hasAdminConfiguration,
  privateAdminResponse,
  readAdminSession,
  requireAdmin,
  startAdminSession,
  verifyConfiguredAdminPasscode,
} from "./admin-auth";
import { exportLeadCsv, getLeadPage, saveLeadManagement } from "./admin-data";

const filterSchema = z.object({
  search: z.string().trim().max(80).default(""),
  status: z.enum(["all", ...LEAD_STATUSES]).default("all"),
  assignedTo: z.enum(["all", ...ADMIN_ASSIGNEES]).default("all"),
  dueOnly: z.boolean().default(false),
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const expiresAt = await readAdminSession();
  return { authenticated: expiresAt !== null, configured: hasAdminConfiguration(), expiresAt };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ passcode: z.string().min(1).max(256) }).parse(data))
  .handler(async ({ data }) => {
    assertAdminSameOrigin();
    consumeAdminLoginAttempt();
    if (!hasAdminConfiguration())
      throw new Error(
        "Admin access is not configured. Check the existing server-only Supabase connection secret and any admin passcode override.",
      );
    if (!(await verifyConfiguredAdminPasscode(data.passcode.trim())))
      throw new Error("Incorrect passcode. Please try again.");
    const expiresAt = await startAdminSession();
    return { authenticated: true, configured: true, expiresAt };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  assertAdminSameOrigin();
  clearAdminSession();
  return { ok: true as const };
});

export const listAdminLeads = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    filterSchema.extend({ page: z.number().int().min(1).max(100_000) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    return getLeadPage(data);
  });

export const updateAdminLead = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-zA-Z0-9_-]+$/),
        status: z.enum(LEAD_STATUSES),
        assignedTo: z.enum(ADMIN_ASSIGNEES),
        followUpAt: z.string().datetime({ offset: true }).nullable(),
        notes: z.string().max(10_000),
        revision: z.string().uuid().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    assertAdminSameOrigin();
    await requireAdmin();
    return saveLeadManagement(data);
  });

export const exportAdminLeads = createServerFn({ method: "GET" })
  .inputValidator((data) => filterSchema.parse(data))
  .handler(async ({ data }) => {
    privateAdminResponse();
    await requireAdmin();
    return exportLeadCsv(data);
  });
