import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackingPreferences } from "@/components/TrackingPreferences";
import { PrivacyPage } from "@/routes/privacy";
import {
  getMetaTrackingPreference,
  META_OPTOUT_KEY,
  saveMetaTrackingPreference,
} from "@/lib/tracking-preferences";

beforeEach(() => {
  localStorage.clear();
  delete window.fbq;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete window.fbq;
});

it("provides visible accessible privacy, tracking, and contact links in the footer", () => {
  render(<SiteFooter />);
  expect(screen.getByRole("navigation", { name: "Privacy and contact" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  expect(screen.getByRole("link", { name: "Ad tracking choices" })).toHaveAttribute(
    "href",
    "/privacy#ad-tracking",
  );
  expect(screen.getByRole("link", { name: "Contact Kairos" })).toHaveAttribute(
    "href",
    "mailto:inquiry@kairossecurity.com",
  );
  expect(screen.getByText(/advertising measurement and targeting/)).toBeVisible();
});

it("renders the policy, key provider disclosures, and accessible privacy contact", () => {
  render(<PrivacyPage />);
  expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
  expect(screen.getByText(/Supabase database.*Resend/)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Your Meta ad-tracking choice" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "inquiry@kairossecurity.com" })).toHaveAttribute(
    "href",
    "mailto:inquiry@kairossecurity.com",
  );
  expect(screen.getByRole("link", { name: "Skip to privacy policy" })).toHaveAttribute(
    "href",
    "#privacy-content",
  );
});

describe("Meta tracking choices", () => {
  it("saves only the opt-out preference, revokes a loaded pixel, and reloads", () => {
    const reload = vi.fn();
    window.fbq = vi.fn();
    render(<TrackingPreferences reload={reload} />);
    fireEvent.click(screen.getByRole("button", { name: "Turn off Meta ad tracking" }));
    expect(localStorage.getItem(META_OPTOUT_KEY)).toBe("1");
    expect(localStorage.length).toBe(1);
    expect(window.fbq).toHaveBeenCalledWith("consent", "revoke");
    expect(reload).toHaveBeenCalledOnce();
  });
  it("still reloads after saving if a loaded Pixel rejects its revoke command", () => {
    const reload = vi.fn();
    window.fbq = vi.fn(() => {
      throw new Error("Third-party error");
    });
    render(<TrackingPreferences reload={reload} />);
    fireEvent.click(screen.getByRole("button", { name: "Turn off Meta ad tracking" }));
    expect(localStorage.getItem(META_OPTOUT_KEY)).toBe("1");
    expect(reload).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("can clear a saved opt-out explicitly without changing lead data", () => {
    localStorage.setItem(META_OPTOUT_KEY, "1");
    sessionStorage.setItem("kairos_attribution", '{"utm_source":"facebook"}');
    const reload = vi.fn();
    render(<TrackingPreferences reload={reload} />);
    expect(screen.getByRole("status")).toHaveTextContent("Meta tracking is off");
    fireEvent.click(screen.getByRole("button", { name: "Allow Meta ad tracking" }));
    expect(localStorage.getItem(META_OPTOUT_KEY)).toBeNull();
    expect(sessionStorage.getItem("kairos_attribution")).toContain("facebook");
    expect(reload).toHaveBeenCalledOnce();
  });
  it("respects Global Privacy Control and does not offer an enable override", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    render(<TrackingPreferences reload={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Global Privacy Control");
    expect(screen.queryByRole("button", { name: /Allow Meta/ })).not.toBeInTheDocument();
    expect(getMetaTrackingPreference().globalPrivacyControl).toBe(true);
    expect(() => saveMetaTrackingPreference(false)).toThrow("Global Privacy Control");
  });
  it("reports storage errors instead of claiming success", () => {
    const reload = vi.fn();
    render(<TrackingPreferences reload={reload} />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage restricted");
    });
    fireEvent.click(screen.getByRole("button", { name: "Turn off Meta ad tracking" }));
    expect(screen.getByRole("alert")).toHaveTextContent("could not save");
    expect(reload).not.toHaveBeenCalled();
  });
});
