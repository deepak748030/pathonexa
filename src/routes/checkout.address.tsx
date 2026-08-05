import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddress, type Address } from "@/lib/address-context";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { MapPin, Lock, Sparkles, LocateFixed, Loader2 } from "lucide-react";

import { useState, type FormEvent } from "react";

import { toast } from "sonner";

export const Route = createFileRoute("/checkout/address")({
  validateSearch: (search: Record<string, unknown>) => ({
    welcome: search.welcome === "1" || search.welcome === true ? "1" : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Delivery Address — FEED POINT" },
      { name: "description", content: "Enter your delivery address to continue checkout." },
    ],
  }),
  component: AddressPage,
});

function AddressPage() {
  const { address, saveAddress } = useAddress();
  const { user } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const welcome = search.welcome === "1";

  const [form, setForm] = useState<Address>(
    address ?? {
      fullName: user?.display_name ?? "",
      phone: user?.phone ?? "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
    },
  );

  const update = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const goAfter = () => {
    if (welcome) {
      const redir = search.redirect;
      if (redir && redir.startsWith("/")) {
        window.location.assign(redir);
      } else {
        navigate({ to: "/" });
      }
    } else if (items.length === 0) {
      navigate({ to: "/cart" });
    } else {
      navigate({ to: "/checkout/payment" });
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    saveAddress(form);
    toast.success("Address saved");
    goAfter();
  };

  const skip = () => {
    toast("You can add it anytime from your account");
    goAfter();
  };

  const [locating, setLocating] = useState(false);
  const useCurrentLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location not supported on this device");
      return;
    }
    if (!window.isSecureContext) {
      toast.error("Location needs a secure (https) connection");
      return;
    }
    // Check permission state if supported (some mobile browsers silently block otherwise)
    try {
      const anyNav = navigator as any;
      if (anyNav.permissions?.query) {
        const p = await anyNav.permissions.query({ name: "geolocation" });
        if (p.state === "denied") {
          toast.error("Location blocked. Enable it in browser settings for this site.");
          return;
        }
      }
    } catch {
      // ignore
    }

    setLocating(true);
    const getPos = (opts: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, opts),
      );

    try {
      // Try high accuracy first, then fall back to low accuracy
      let pos: GeolocationPosition;
      try {
        pos = await getPos({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      } catch {
        pos = await getPos({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
      }
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        { headers: { Accept: "application/json" } },
      );
      const data = await res.json();
      const a = data.address ?? {};
      const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
      const line2 = [a.neighbourhood, a.suburb, a.village].filter(Boolean).join(", ");
      setForm((f) => ({
        ...f,
        line1: line1 || f.line1,
        line2: line2 || f.line2,
        city: a.city || a.town || a.village || a.county || f.city,
        state: a.state || f.state,
        pincode: a.postcode || f.pincode,
      }));
      toast.success("Location filled");
    } catch (err: any) {
      const code = err?.code;
      if (code === 1) toast.error("Location permission denied. Allow it in browser settings.");
      else if (code === 2) toast.error("Location unavailable. Try again outside or check GPS.");
      else if (code === 3) toast.error("Location request timed out. Try again.");
      else toast.error("Couldn't get your location");
    } finally {
      setLocating(false);
    }
  };



  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3 sm:pt-6 sm:pb-24">
      {welcome ? (
        <>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Welcome to FEED POINT
          </p>
          <h1 className="mt-1 sm:mt-2 font-display text-xl sm:text-5xl">Namaste{form.fullName ? `, ${form.fullName.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
            Save a delivery address now so checkout is one tap next time — or skip and add it later.
          </p>
        </>
      ) : (
        <>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Delivery details
          </p>
          <h1 className="mt-1 sm:mt-2 font-display text-xl sm:text-5xl">Where should we deliver?</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            Your sacks will reach this address, fresh from the mill.
          </p>
        </>
      )}

      <form onSubmit={submit} className="mt-4 sm:mt-10 space-y-3 sm:space-y-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useCurrentLocation}
          disabled={locating}
          className="gap-2 h-8 text-xs sm:h-9 sm:text-sm"
        >
          {locating ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <LocateFixed className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          {locating ? "Fetching location…" : "Use current location"}
        </Button>

        <div className="grid gap-3 sm:gap-5 sm:grid-cols-2">
          <Field label="Full name*">
            <Input value={form.fullName} onChange={update("fullName")} placeholder="Ravinder Singh" className="h-9 text-sm sm:h-10 sm:text-base" />
          </Field>
          <Field label="Phone (verified)">
            <div className="relative">
              <Input
                value={form.phone}
                readOnly
                disabled
                className="pr-9 h-9 text-sm sm:h-10 sm:text-base opacity-90 cursor-not-allowed"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
            </div>
          </Field>
        </div>

        <Field label="Address line 1*">
          <Input value={form.line1} onChange={update("line1")} placeholder="House / farm number, street" className="h-9 text-sm sm:h-10 sm:text-base" />
        </Field>
        <Field label="Address line 2">
          <Input value={form.line2 ?? ""} onChange={update("line2")} placeholder="Area, colony (optional)" className="h-9 text-sm sm:h-10 sm:text-base" />
        </Field>

        <div className="grid gap-3 sm:gap-5 sm:grid-cols-3">
          <Field label="City*">
            <Input value={form.city} onChange={update("city")} placeholder="Ludhiana" className="h-9 text-sm sm:h-10 sm:text-base" />
          </Field>
          <Field label="State*">
            <Input value={form.state} onChange={update("state")} placeholder="Punjab" className="h-9 text-sm sm:h-10 sm:text-base" />
          </Field>
          <Field label="Pincode*">
            <Input value={form.pincode} onChange={update("pincode")} placeholder="141001" maxLength={6} className="h-9 text-sm sm:h-10 sm:text-base" />
          </Field>
        </div>

        <Field label="Landmark">
          <Input value={form.landmark ?? ""} onChange={update("landmark")} placeholder="Near… (optional)" className="h-9 text-sm sm:h-10 sm:text-base" />
        </Field>

        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button type="submit" size="sm" className="h-11 text-sm sm:flex-1 sm:h-11 sm:text-base">
            {welcome ? "Save address" : "Save & continue to payment"}
          </Button>
          {welcome ? (
            <Button type="button" variant="muted" size="sm" className="h-11 text-sm sm:h-11 sm:text-base" onClick={skip}>
              Skip for now
            </Button>
          ) : (
            <Button asChild variant="muted" size="sm" className="h-11 text-sm sm:h-11 sm:text-base">
              <Link to="/cart">Cancel</Link>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
