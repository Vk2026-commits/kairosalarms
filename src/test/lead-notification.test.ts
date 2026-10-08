import { afterEach, describe, expect, it, vi } from "vitest";

import {
  renderLeadNotification,
  sendLeadNotification,
  type LeadNotificationInput,
} from "@/lib/lead-notification";

const lead: LeadNotificationInput = {
  submissionId: "74f4ebfc-2e30-4f96-bf73-f844b1228e5d",
  firstName: "Taylor",
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

describe("Kairos lead notification", () => {
  it("renders a branded email with escaped prospect details and clear callback actions", () => {
    const content = renderLeadNotification({ ...lead, firstName: "Taylor <Lead>" });

    expect(content.html).toContain("Kairos Security<br />Protection Plan");
    expect(content.html).toContain("Taylor &lt;Lead&gt;");
    expect(content.html).toContain("Alarm + security cameras");
    expect(content.html).toContain("tel:+12815550199");
    expect(content.html).toContain("mailto:taylor%40example.com");
    expect(content.text).toContain("NEW SECURITY LEAD");
    expect(content.text).toContain("Contact consent: Yes");
  });

  it("sends the callback alert to the Kairos inbox with a retry-safe key", async () => {
    process.env["KAIROS_RESEND_API_KEY"] = "test-key";
    process.env["KAIROS_RESEND_FROM"] = "Kairos Security Protection Plan <leads@example.com>";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendLeadNotification(lead)).resolves.toEqual({ id: "email_123" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      from: string;
      to: string[];
      reply_to: string;
      subject: string;
      tags: { name: string; value: string }[];
    };

    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
      "Idempotency-Key": "kairos-lead/74f4ebfc-2e30-4f96-bf73-f844b1228e5d",
    });
    expect(body).toMatchObject({
      from: "Kairos Security Protection Plan <leads@example.com>",
      to: ["staylor@kariossecurity.com"],
      reply_to: "taylor@example.com",
      subject: "New Kairos Security lead — Taylor",
    });
    expect(body.tags).toContainEqual({ name: "category", value: "security-lead" });
  });
});
