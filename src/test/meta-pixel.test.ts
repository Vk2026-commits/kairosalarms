import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_PHONE } from "@/lib/business-phone";

describe("Production-only Meta tracking", () => {
  const fbq = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    fbq.mockReset();
    localStorage.clear();
    vi.stubEnv("PROD", true);
    vi.stubGlobal("window", {
      location: { hostname: "alarms.kairossecurity.com" },
      localStorage,
      fbq,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each(["localhost", "kairosalarms.lovable.app", "id-preview--example.lovable.app", "unrelated.com", "alarms.kairossecurity.com.evil.com"])("never initializes or tracks on %s", async (hostname) => {
    window.location.hostname = hostname;
    const pixel = await import("@/lib/meta-pixel");
    expect(pixel.initMetaPixel()).toBe(false);
    pixel.trackMetaPageView("/");
    pixel.trackMetaLead("accepted-submission");
    expect(fbq).not.toHaveBeenCalled();
  });

  it("rejects development even on the production hostname", async () => {
    vi.stubEnv("PROD", false);
    const pixel = await import("@/lib/meta-pixel");
    pixel.trackMetaPageView("/");
    pixel.trackMetaLead("accepted-submission");
    expect(fbq).not.toHaveBeenCalled();
  });

  it("initializes Pixel 4539741692932903 once and deduplicates page views", async () => {
    const pixel = await import("@/lib/meta-pixel");
    pixel.trackMetaPageView("/");
    pixel.trackMetaPageView("/");
    pixel.trackMetaPageView("/contact");
    expect(fbq.mock.calls.filter(([command]) => command === "init")).toEqual([["init", "4539741692932903"]]);
    expect(fbq.mock.calls.filter(([, event]) => event === "PageView")).toHaveLength(2);
  });

  it("counts an accepted submission once, including after refresh", async () => {
    let pixel = await import("@/lib/meta-pixel");
    pixel.trackMetaLead("accepted-submission");
    pixel.trackMetaLead("accepted-submission");
    vi.resetModules();
    pixel = await import("@/lib/meta-pixel");
    pixel.trackMetaLead("accepted-submission");
    expect(fbq.mock.calls.filter(([, event]) => event === "Lead")).toEqual([
      ["track", "Lead", {}, { eventID: "accepted-submission" }],
    ]);
  });

  it("respects stored opt-out", async () => {
    localStorage.setItem("kairos_tracking_optout", "1");
    const pixel = await import("@/lib/meta-pixel");
    pixel.trackMetaPageView("/");
    pixel.trackMetaLead("accepted-submission");
    expect(fbq).not.toHaveBeenCalled();
  });

  it("respects Global Privacy Control", async () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const pixel = await import("@/lib/meta-pixel");
    pixel.trackMetaPageView("/");
    pixel.trackMetaLead("accepted-submission");
    expect(fbq).not.toHaveBeenCalled();
  });
});

it("uses the correct business phone number", () => {
  expect(BUSINESS_PHONE).toBe("+18885247678");
});