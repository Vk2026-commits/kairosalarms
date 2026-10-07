import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const leadSchema = z.object({
  firstName: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email(),
  zip: z.string().min(3),
  callConsent: z.literal(true),
  propertyType: z.string().optional(),
  exteriorDoors: z.string().optional(),
  securityType: z.string().optional(),
  attribution: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Inserts a quote-funnel lead into the user's own Supabase `leads` table.
 * Uses the service key server-side only; the key never reaches the browser.
 */
export const saveLead = createServerFn({ method: "POST" })
  .inputValidator((data) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const url = process.env["KAIROS_SUPABASE_URL"]!;
    const key = process.env["KAIROS_SUPABASE_SERVICE_KEY"]!;

    const res = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        first_name: data.firstName,
        phone: data.phone,
        email: data.email,
        zip: data.zip,
        call_consent: data.callConsent,
        property_type: data.propertyType ?? null,
        exterior_doors: data.exteriorDoors ?? null,
        security_type: data.securityType ?? null,
        attribution: data.attribution ?? null,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Lead insert failed (${res.status}): ${body}`);
    }
    return { ok: true };
  });
