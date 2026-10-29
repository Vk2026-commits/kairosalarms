import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { QuoteFunnel } from "@/components/QuoteFunnel";

const mocks = vi.hoisted(() => ({ submitLead: vi.fn(), trackMetaLead: vi.fn() }));
vi.mock("@/lib/leads", () => ({ submitLead: mocks.submitLead }));
vi.mock("@/lib/tracking", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/meta-pixel", () => ({ trackMetaLead: mocks.trackMetaLead }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

async function completeForm() {
  render(<QuoteFunnel />);
  fireEvent.click(screen.getByRole("button", { name: "My Home" }));
  fireEvent.click(await screen.findByRole("button", { name: "1 door" }));
  fireEvent.click(await screen.findByRole("button", { name: "Alarm system" }));
  const firstName = await screen.findByPlaceholderText("First name");
  fireEvent.change(firstName, { target: { value: "Test" } });
  for (const [placeholder, value] of [["Last name", "Acceptance"], ["Mobile phone", "2025550101"], ["Email", "test@example.com"], ["ZIP code", "77002"]] as const) {
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
  }
  fireEvent.click(screen.getByRole("checkbox"));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Show My Options" })); });
}

it("fires Lead only after the submission is accepted, never while pending", async () => {
  let accept: (() => void) | undefined;
  mocks.submitLead.mockImplementation(() => new Promise<void>((resolve) => { accept = resolve; }));
  await completeForm();
  expect(mocks.submitLead).toHaveBeenCalledOnce();
  expect(mocks.trackMetaLead).not.toHaveBeenCalled();
  await act(async () => { accept?.(); });
  await waitFor(() => expect(mocks.trackMetaLead).toHaveBeenCalledOnce());
  expect(mocks.trackMetaLead).toHaveBeenCalledWith(mocks.submitLead.mock.calls[0]?.[0].submissionId);
});

it("never fires Lead for a rejected submission", async () => {
  mocks.submitLead.mockRejectedValue(new Error("Rejected"));
  await completeForm();
  await screen.findByRole("alert");
  expect(mocks.trackMetaLead).not.toHaveBeenCalled();
});