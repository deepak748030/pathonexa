import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Phone } from "lucide-react";
import { BackButton } from "@/components/site/BackButton";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    checkout: search.checkout === "1" || search.checkout === true ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — FEED POINT" },
      { name: "description", content: "Sign in to FEED POINT with your Indian mobile number." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const goNext = () => {
    if (search.redirect) {
      const target = search.redirect + (search.checkout ? (search.redirect.includes("?") ? "&" : "?") + "checkout=1" : "");
      window.location.assign(target);
    } else {
      navigate({ to: "/" });
    }
  };

  useEffect(() => {
    // Only auto-redirect if user was already signed in when arriving on this page
    if (!loading && user && step === "phone" && !busy) goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);


  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const validPhone = /^[6-9]\d{9}$/.test(cleanPhone);

  const requestOtp = async () => {
    if (!validPhone) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setBusy(true);
    try {
      const { otp } = await sendOtp(cleanPhone);
      toast.success(`OTP sent to +91 ${cleanPhone}`, { description: `Demo OTP: ${otp}` });
      setStep("otp");
      setResendIn(30);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setBusy(true);
    try {
      const { isNew } = await verifyOtp(cleanPhone, otp, name);
      toast.success(isNew ? "Welcome to FEED POINT!" : "Signed in");
      if (isNew) {
        const redir = search.redirect ?? "/";
        navigate({ to: "/checkout/address", search: { welcome: "1", redirect: redir } as any });
      } else {
        goNext();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-6 sm:py-16">
      <BackButton />
      <h1 className="mt-3 sm:mt-6 font-display text-4xl">
        {step === "phone" ? "Sign in" : "Verify OTP"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {step === "phone"
          ? "We'll send a one-time code to your mobile number."
          : `Enter the 6-digit code sent to +91 ${cleanPhone}.`}
      </p>

      <div className="mt-8 space-y-4">
        {step === "phone" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="flex items-center rounded-md border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40">
                <span className="pl-3 pr-2 text-sm text-muted-foreground border-r border-border/60 py-2.5 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> +91
                </span>
                <Input
                  id="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Indian numbers only. Starts with 6, 7, 8, or 9.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={requestOtp} disabled={!validPhone} loading={busy}>
              {busy ? "Sending OTP" : "Send OTP"}
            </Button>
          </>
        ) : (
          <form onSubmit={confirmOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
            >
              <ArrowLeft className="h-3 w-3" /> Change number
            </button>
            <div className="space-y-1.5">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-[0.6em] font-display"
              />
            </div>
            <Button type="submit" className="w-full" disabled={otp.length !== 6} loading={busy}>
              {busy ? "Verifying" : "Verify & sign in"}
            </Button>
            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={requestOtp}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
