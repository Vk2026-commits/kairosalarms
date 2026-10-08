export type LeadNotificationInput = {
  submissionId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  zip: string;
  callConsent: true;
  propertyType?: string | undefined;
  exteriorDoors?: string | undefined;
  securityType?: string | undefined;
};

type ResendResponse = {
  id?: string;
};

type ResendEmailPayload = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
  text: string;
  tags: { name: string; value: string }[];
};

const LEAD_RECIPIENT = "staylor@kariossecurity.com";
const BRAND_NAME = "Kairos Security Protection Plan";
const KAIROS_SECURITY_PHONE = "+12815550134";

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function phoneHref(value: string): string {
  return value.replace(/[^+\d]/g, "");
}

function fullName(lead: LeadNotificationInput): string {
  return `${lead.firstName} ${lead.lastName}`.trim();
}

function labelPropertyType(value?: string): string {
  if (value === "home") return "Home";
  if (value === "business") return "Business";
  return "Not provided";
}

function labelExteriorDoors(value?: string): string {
  if (!value) return "Not provided";
  return value === "1" ? "1 exterior door" : `${value} exterior doors`;
}

function labelSecurityType(value?: string): string {
  const labels: Record<string, string> = {
    alarm: "Alarm system",
    "alarm-doorbell": "Alarm + doorbell camera",
    "alarm-cameras": "Alarm + security cameras",
    "not-sure": "Wants recommendations",
  };
  return labels[value ?? ""] ?? "Not provided";
}

function renderDetailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eadfe1; color: #6f5d61; font-size: 13px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; width: 42%;">${escapeHtml(label)}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eadfe1; color: #241517; font-size: 15px; font-weight: 600;">${escapeHtml(value)}</td>
    </tr>`;
}

/** Branded callback brief sent to the Kairos team. */
export function renderLeadNotification(lead: LeadNotificationInput): {
  html: string;
  text: string;
} {
  const propertyType = labelPropertyType(lead.propertyType);
  const exteriorDoors = labelExteriorDoors(lead.exteriorDoors);
  const securityType = labelSecurityType(lead.securityType);
  const leadName = fullName(lead);
  const safeLeadName = escapeHtml(leadName);
  const safeEmail = escapeHtml(lead.email);
  const callHref = `tel:${phoneHref(lead.phone)}`;
  const emailHref = `mailto:${encodeURIComponent(lead.email)}`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>New Kairos Security Lead</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f6f3f4; color: #241517; font-family: Inter, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f6f3f4; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background: #ffffff; border: 1px solid #eadfe1; border-radius: 18px; overflow: hidden;">
            <tr>
              <td style="height: 6px; background: #470101; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background: #2f0506; padding: 28px 32px;">
                <p style="margin: 0; color: #e7bd54; font-size: 11px; font-weight: 800; letter-spacing: 0.19em; text-transform: uppercase;">New security lead</p>
                <h1 style="margin: 9px 0 0; color: #ffffff; font-family: 'Plus Jakarta Sans', Inter, Arial, sans-serif; font-size: 26px; line-height: 1.2;">Kairos Security<br />Protection Plan</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 32px 8px;">
                <p style="margin: 0; color: #6f5d61; font-size: 14px; line-height: 1.5;">A new prospect completed the security options form. Follow up promptly while their request is fresh.</p>
                <h2 style="margin: 23px 0 4px; color: #241517; font-family: 'Plus Jakarta Sans', Inter, Arial, sans-serif; font-size: 24px; line-height: 1.25;">${safeLeadName}</h2>
                <p style="margin: 0; color: #7a2428; font-size: 14px; font-weight: 700;">Houston-area security consultation request</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                  ${renderDetailRow("Phone", lead.phone)}
                  ${renderDetailRow("Email", lead.email)}
                  ${renderDetailRow("ZIP code", lead.zip)}
                  ${renderDetailRow("Property", propertyType)}
                  ${renderDetailRow("Exterior doors", exteriorDoors)}
                  ${renderDetailRow("Interested in", securityType)}
                  ${renderDetailRow("Contact consent", "Yes — phone and text consent recorded")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 32px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius: 9px; background: #470101;">
                      <a href="${callHref}" style="display: inline-block; padding: 13px 20px; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none;">Call ${safeLeadName}</a>
                    </td>
                    <td style="width: 12px;">&nbsp;</td>
                    <td style="border: 1px solid #470101; border-radius: 9px;">
                      <a href="${emailHref}" style="display: inline-block; padding: 12px 19px; color: #470101; font-size: 14px; font-weight: 800; text-decoration: none;">Email prospect</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background: #fbf8f8; border-top: 1px solid #eadfe1;">
                <p style="margin: 0; color: #846f73; font-size: 12px; line-height: 1.5;">This notification was generated from the Kairos Security Protection Plan website. Replying to this email sends a message directly to ${safeEmail}.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "KAIROS SECURITY PROTECTION PLAN — NEW SECURITY LEAD",
    "",
    `${leadName} completed the security options form.`,
    "",
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `ZIP code: ${lead.zip}`,
    `Property: ${propertyType}`,
    `Exterior doors: ${exteriorDoors}`,
    `Interested in: ${securityType}`,
    "Contact consent: Yes — phone and text consent recorded",
    "",
    "Reply to this email to contact the prospect directly.",
  ].join("\n");

  return { html, text };
}

/** Branded confirmation sent to the prospect after the team callback alert succeeds. */
export function renderCustomerConfirmation(lead: LeadNotificationInput): {
  html: string;
  text: string;
} {
  const safeFirstName = escapeHtml(lead.firstName);
  const propertyType = labelPropertyType(lead.propertyType);
  const securityType = labelSecurityType(lead.securityType);
  const propertySummary =
    propertyType === "Not provided" ? "your property" : `your ${propertyType.toLowerCase()}`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>We received your Kairos Security request</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f6f3f4; color: #241517; font-family: Inter, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f6f3f4; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background: #ffffff; border: 1px solid #eadfe1; border-radius: 18px; overflow: hidden;">
            <tr>
              <td style="height: 6px; background: #470101; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background: #2f0506; padding: 28px 32px;">
                <p style="margin: 0; color: #e7bd54; font-size: 11px; font-weight: 800; letter-spacing: 0.19em; text-transform: uppercase;">Request received</p>
                <h1 style="margin: 9px 0 0; color: #ffffff; font-family: 'Plus Jakarta Sans', Inter, Arial, sans-serif; font-size: 26px; line-height: 1.2;">Kairos Security<br />Protection Plan</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h2 style="margin: 0; color: #241517; font-family: 'Plus Jakarta Sans', Inter, Arial, sans-serif; font-size: 26px; line-height: 1.25;">Thanks, ${safeFirstName} — we received your request.</h2>
                <p style="margin: 18px 0 0; color: #59484b; font-size: 16px; line-height: 1.65;">A Kairos Security specialist will call you soon to talk through protection options for ${escapeHtml(propertySummary)} and answer your questions.</p>
                <div style="margin: 24px 0; border: 1px solid #eadfe1; border-radius: 12px; background: #fbf8f8; padding: 18px 20px;">
                  <p style="margin: 0; color: #7a2428; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;">Your requested protection</p>
                  <p style="margin: 7px 0 0; color: #241517; font-size: 17px; font-weight: 700;">${escapeHtml(securityType)}</p>
                </div>
                <p style="margin: 0; color: #59484b; font-size: 15px; line-height: 1.65;">Security options start at <strong style="color: #470101;">$39.99/mo</strong> with no credit check required. Your Kairos Security specialist will confirm the setup and pricing that fit your property.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 26px;">
                  <tr>
                    <td style="border-radius: 9px; background: #470101;">
                      <a href="tel:${KAIROS_SECURITY_PHONE}" style="display: inline-block; padding: 13px 20px; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none;">Call Kairos Security</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background: #fbf8f8; border-top: 1px solid #eadfe1;">
                <p style="margin: 0; color: #846f73; font-size: 12px; line-height: 1.5;">You are receiving this confirmation because you asked ${BRAND_NAME} to contact you about security options. Questions? Reply to this email and our team will be happy to help.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "KAIROS SECURITY PROTECTION PLAN — REQUEST RECEIVED",
    "",
    `Thanks, ${lead.firstName} — we received your request.`,
    `A Kairos Security specialist will call you soon to talk through protection options for ${propertySummary} and answer your questions.`,
    "",
    `Requested protection: ${securityType}`,
    "",
    "Security options start at $39.99/mo with no credit check required. Your Kairos Security specialist will confirm the setup and pricing that fit your property.",
    "Reply to this email if you have questions.",
  ].join("\n");

  return { html, text };
}

async function sendResendEmail(
  apiKey: string,
  payload: ResendEmailPayload,
  idempotencyKey: string,
  emailType: "internal" | "customer",
): Promise<ResendResponse> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error("Resend lead email failed", { emailType, status: response.status });
    throw new Error("Lead email could not be sent.");
  }

  return (await response.json().catch(() => ({}))) as ResendResponse;
}

/** Sends the internal callback alert and the prospect's confirmation email. */
export async function sendLeadEmails(
  lead: LeadNotificationInput,
): Promise<{ internal: ResendResponse; customer: ResendResponse }> {
  const apiKey = getRequiredEnvironmentVariable("KAIROS_RESEND_API_KEY");
  const from = getRequiredEnvironmentVariable("KAIROS_RESEND_FROM");
  const internalContent = renderLeadNotification(lead);
  const internal = await sendResendEmail(
    apiKey,
    {
      from,
      to: [LEAD_RECIPIENT],
      reply_to: lead.email,
      subject: `New Kairos Security lead — ${fullName(lead)}`,
      html: internalContent.html,
      text: internalContent.text,
      tags: [
        { name: "category", value: "security-lead" },
        { name: "submission_id", value: lead.submissionId },
      ],
    },
    `kairos-lead-internal/${lead.submissionId}`,
    "internal",
  );
  const customerContent = renderCustomerConfirmation(lead);
  const customer = await sendResendEmail(
    apiKey,
    {
      from,
      to: [lead.email],
      reply_to: LEAD_RECIPIENT,
      subject: "Thanks — Kairos Security received your request",
      html: customerContent.html,
      text: customerContent.text,
      tags: [
        { name: "category", value: "security-lead-confirmation" },
        { name: "submission_id", value: lead.submissionId },
      ],
    },
    `kairos-lead-confirmation/${lead.submissionId}`,
    "customer",
  );

  return { internal, customer };
}
