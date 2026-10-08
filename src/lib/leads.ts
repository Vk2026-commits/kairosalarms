/**
 * Lead persistence for the Kairos quote funnel.
 *
 * Leads are saved to the user's own Supabase project (KAIROS_SUPABASE_URL)
 * through the `saveLead` server function, which inserts into the `leads`
 * table with the service key kept server-side.
 */

import { getAttribution } from "./tracking";
import { saveLead } from "./leads.functions";

export interface QuoteAnswers {
  propertyType?: string;
  exteriorDoors?: string;
  securityType?: string;
}

export interface LeadPayload extends QuoteAnswers {
  /** UUID reused for safe retry handling in the notification provider. */
  submissionId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  zip: string;
  /** Express written consent to be called/texted (TCPA). */
  callConsent: boolean;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  await saveLead({
    data: {
      ...payload,
      attribution: getAttribution() as Record<string, unknown>,
    },
  });
}
