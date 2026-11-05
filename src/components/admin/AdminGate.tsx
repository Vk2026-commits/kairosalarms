import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminBrand, Busy } from "./admin-ui";

export function AdminGate({
  checking,
  configured,
  error,
  busy,
  onLogin,
  onRetry,
}: {
  checking: boolean;
  configured: boolean | null;
  error: string | null;
  busy: boolean;
  onLogin: (passcode: string) => Promise<void>;
  onRetry: () => void;
}) {
  const [passcode, setPasscode] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = passcode;
    setPasscode("");
    await onLogin(submitted);
  }
  return (
    <div className="flex min-h-svh flex-col bg-[#f7f4ed] text-foreground">
      <header className="bg-burgundy-deep px-5 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <AdminBrand />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <section
          className="w-full max-w-md rounded-xl border border-[#e4ddd1] bg-white p-7 shadow-soft sm:p-9"
          aria-label="Admin sign-in"
        >
          <span className="mb-6 flex size-11 items-center justify-center rounded-lg bg-primary/5 text-primary">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c6850]">
            Private operations workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Lead management</h1>
          {checking ? (
            <div className="mt-6 text-muted-foreground">
              <Busy>Checking admin session…</Busy>
            </div>
          ) : configured === false ? (
            <div className="mt-5 space-y-4 text-sm leading-relaxed">
              <h2 className="font-semibold">One-time server setup required</h2>
              <p>
                Confirm{" "}
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                  KAIROS_SUPABASE_SERVICE_KEY
                </code>{" "}
                is present in Lovable server secrets. The shared passcode verifier is already
                configured on the server.
              </p>
              <p className="text-muted-foreground">
                If you set a KAIROS_ADMIN_PASSCODE override, it must contain at least 12 characters.
                Never add a passcode to frontend code or a public link.
              </p>
              <Button type="button" variant="outline" onClick={onRetry}>
                Check configuration again
              </Button>
            </div>
          ) : configured === null ? (
            <div className="mt-5">
              <p role="alert" className="mb-4 text-sm text-destructive">
                {error ?? "Unable to check the admin session."}
              </p>
              <Button type="button" variant="outline" onClick={onRetry}>
                Retry session check
              </Button>
            </div>
          ) : (
            <form className="mt-5 space-y-5" onSubmit={submit}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sign in with your team's shared passcode to view and follow up on submitted
                inquiries.
              </p>
              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-passcode">Admin passcode</Label>
                <Input
                  id="admin-passcode"
                  name="passcode"
                  type="password"
                  autoComplete="off"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  disabled={busy}
                  required
                  className="h-11 bg-white"
                />
              </div>
              <Button type="submit" disabled={busy || !passcode} className="h-11 w-full">
                {busy ? (
                  <Busy>Signing in…</Busy>
                ) : (
                  <>
                    Sign in <ArrowRight aria-hidden="true" />
                  </>
                )}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Access is verified by the server. Customer details are only loaded after you sign
                in.
              </p>
            </form>
          )}
        </section>
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-muted-foreground">
        Kairos Security · Authorized team access only
      </footer>
    </div>
  );
}
