import { afterEach, describe, expect, it, vi } from "vitest";

import {
  renderCustomerConfirmation,
  renderLeadNotification,
  sendLeadEmails,
  type LeadNotificationInput,
} from "@/lib/lead-notification";

const lead: LeadNotificationInput = {
  submissionId: "74f4ebfc-2e30-4f96-bf73-f844b1228e5d",
  firstName: "Taylor",
  lastName: "Johnson",
  phone: "+1 (281) 555-0199",
  email: "taylor@example.com",
  zip: "77002",
  callConsent: true,
  propertyType: "home",
  exteriorDoors: "2",
  securityType: "alarm-cameras",
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env["KAIROS_RESEND_API_KEY"];
  delete process.env["KAIROS_RESEND_FROM"];
});

describe("Kairos lead emails", () => {
  it("renders a branded internal lead brief with escaped prospect details and callback actions", () => {
    const content = renderLeadNotification({ ...lead, firstName: "Taylor <Lead>" });

    expect(content.html).toContain("Kairos Security<br />Protection Plan");
    expect(content.html).toContain("Taylor &lt;Lead&gt; Johnson");
    expect(content.html).toContain("Alarm + security cameras");
    expect(content.html).toContain("tel:+12815550199");
    expect(content.html).toContain("mailto:taylor%40example.com");
    expect(content.text).toContain("NEW SECURITY LEAD");
    expect(content.text).toContain("Contact consent: Yes");
  });

  it("renders a branded customer confirmation without exposing the callback brief", () => {
    const content = renderCustomerConfirmation({ ...lead, firstName: "Taylor <Lead>" });

    expect(content.html).toContain("Thanks, Taylor &lt;Lead&gt; — we received your request.");
    expect(content.html).toContain("A Kairos Security specialist will call you soon");
    expect(content.html).toContain("Alarm + security cameras");
    expect(content.html).toContain("tel:+12815550134");
    expect(content.text).toContain("REQUEST RECEIVED");
    expect(content.text).not.toContain("Contact consent");
  });

  it("sends an internal callback alert and a retry-safe customer confirmation", async () => {
    process.env["KAIROS_RESEND_API_KEY"] = "test-key";
    process.env["KAIROS_RESEND_FROM"] = "Kairos Security Protection Plan <leads@example.com>";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "internal_email_123" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "customer_email_456" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendLeadEmails(lead)).resolves.toEqual({
      internal: { id: "internal_email_123" },
      customer: { id: "customer_email_456" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [internalUrl, internalInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [customerUrl, customerInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const internalBody = JSON.parse(internalInit.body as string) as {
      from: string;
      to: string[];
      reply_to: string;
      subject: string;
      tags: { name: string; value: string }[];
    };
    const customerBody = JSON.parse(customerInit.body as string) as {
      from: string;
      to: string[];
      reply_to: string;
      subject: string;
      tags: { name: string; value: string }[];
    };

    expect(internalUrl).toBe("https://api.resend.com/emails");
    expect(internalInit.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
      "Idempotency-Key": "kairos-lead-internal/74f4ebfc-2e30-4f96-bf73-f844b1228e5d",
    });
    expect(internalBody).toMatchObject({
      from: "Kairos Security Protection Plan <leads@example.com>",
      to: ["staylor@kariossecurity.com"],
      reply_to: "taylor@example.com",
      subject: "New Kairos Security lead — Taylor Johnson",
    });
    expect(internalBody.tags).toContainEqual({ name: "category", value: "security-lead" });

    expect(customerUrl).toBe("https://api.resend.com/emails");
    expect(customerInit.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
      "Idempotency-Key": "kairos-lead-confirmation/74f4ebfc-2e30-4f96-bf73-f844b1228e5d",
    });
    expect(customerBody).toMatchObject({
      from: "Kairos Security Protection Plan <leads@example.com>",
      to: ["taylor@example.com"],
      reply_to: "staylor@kariossecurity.com",
      subject: "Thanks — Kairos Security received your request",
    });
    expect(customerBody.tags).toContainEqual({
      name: "category",
      value: "security-lead-confirmation",
    });
  });
});
