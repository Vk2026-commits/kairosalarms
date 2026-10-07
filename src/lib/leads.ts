/**
 * Lead persistence for the Kairos quote funnel.
 *
 * Lovable Cloud is intentionally NOT connected. When the user connects
 * their own Supabase project, replace the body of `submitLead` with an
 * insert into their leads table (and optionally a Conversions API call).
 * Until then, leads are kept in memory and logged so the funnel is fully
 * testable end to end.
 */

import { getAttribution } from "./tracking";

export interface QuoteAnswers {
  propertyType?: string;
  exteriorDoors?: string;
  securityType?: string;
}

export interface LeadPayload extends QuoteAnswers {
  firstName: string;
  phone: string;
  email: string;
  zip: string;
  /** Express written consent to be called/texted (TCPA). */
  callConsent: boolean;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  const lead = {
    ...payload,
    attribution: getAttribution(),
    submittedAt: new Date().toISOString(),
  };

  // TODO(supabase): insert `lead` into the user's own Supabase `leads` table.
  console.info("[kairos] lead captured (not yet persisted):", lead);
}
