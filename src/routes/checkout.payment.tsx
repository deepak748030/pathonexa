import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAddress } from "@/lib/address-context";
import { useAuth } from "@/lib/auth-context";
import { useOrders } from "@/lib/orders-context";
import { CreditCard, Smartphone, Banknote, Wallet, Check, MapPin } from "lucide-react";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/payment")({
  head: () => ({
    meta: [
      { title: "Payment — FEED POINT" },
      { name: "description", content: "Choose a payment method to complete your order." },
    ],
  }),
  component: PaymentPage,
});

type Method = "upi" | "card" | "wallet" | "cod";

const METHODS: { id: Method; label: string; sub: string; icon: typeof CreditCard }[] = [
  { id: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "wallet", label: "Wallet", sub: "Paytm, Amazon Pay", icon: Wallet },
  { id: "cod", label: "Cash on Delivery", sub: "Pay when the sacks arrive", icon: Banknote },
];

function PaymentPage() {
  const { items, subtotal, promoObj, discount, freeShip, clear } = useCart();
  const { address } = useAddress();
  const { user } = useAuth();
  const { placeOrder } = useOrders();
  const navigate = useNavigate();

  const [method, setMethod] = useState<Method>("upi");
  const [processing, setProcessing] = useState(false);

  const shipping = items.length === 0 ? 0 : freeShip || subtotal - discount >= 5000 ? 0 : 250;
  const total = Math.max(0, subtotal - discount) + shipping;

  // Guards
  useEffect(() => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/cart" } });
    } else if (!address) {
      navigate({ to: "/checkout/address" });
    } else if (items.length === 0) {
      navigate({ to: "/cart" });
    }
  }, [user, address, items.length, navigate]);

  const pay = async () => {
    if (!address || items.length === 0) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1600));
    const order = placeOrder({
      items: items.map(({ product, qty }) => ({ product, qty })),
      subtotal,
      discount,
      shipping,
      total,
      promoCode: promoObj?.code ?? null,
    });
    setProcessing(false);
    clear();
    toast.success("Payment successful!", { description: `Order ${order.id} confirmed.` });
    navigate({ to: "/orders" });
  };

  if (!address || items.length === 0) return null;

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-3 sm:pt-6 sm:pb-24">
      {/* Stepper */}
      <div className="flex justify-center sm:justify-start flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] uppercase tracking-widest">

        <span className="text-muted-foreground inline-flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Address</span>
        <span className="text-muted-foreground/50">—</span>
        <span className="text-primary">2. Payment</span>
        <span className="text-muted-foreground/50">—</span>
        <span className="text-muted-foreground">3. Done</span>
      </div>

      <p className="mt-4 sm:mt-6 text-xs uppercase tracking-[0.3em] text-primary">Checkout</p>
      <h1 className="mt-1 sm:mt-2 font-display text-2xl sm:text-5xl">Choose a payment method</h1>

      <div className="mt-4 sm:mt-10 grid gap-4 sm:gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Address card */}
          <div className="rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Deliver to
                </p>
                <p className="mt-2 font-medium text-sm sm:text-base break-words">{address.fullName} · +91 {address.phone}</p>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                  {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} — {address.pincode}
                  {address.landmark ? ` (${address.landmark})` : ""}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to="/checkout/address">Change</Link>
              </Button>
            </div>
          </div>

          {/* Methods */}
          <ul className="space-y-3">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 sm:gap-4 rounded-2xl border p-3 sm:p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/40 bg-card/40"
                    }`}
                  >
                    <span className={`h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full grid place-items-center border ${active ? "border-primary text-primary bg-primary/10" : "border-border/60 text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    </span>
                    <span className={`h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center ${active ? "border-primary" : "border-border"}`}>
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>

                  {active && m.id === "upi" && (
                    <MockField placeholder="you@upi" label="UPI ID" />
                  )}
                  {active && m.id === "card" && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px_120px] rounded-xl border border-border/60 bg-background/50 p-4">
                      <MockInput placeholder="Card number" />
                      <MockInput placeholder="MM/YY" />
                      <MockInput placeholder="CVV" />
                    </div>
                  )}
                  {active && m.id === "wallet" && (
                    <p className="mt-3 text-xs text-muted-foreground px-4">You'll be redirected to your wallet to complete the payment.</p>
                  )}
                  {active && m.id === "cod" && (
                    <p className="mt-3 text-xs text-muted-foreground px-4">Please keep ₹{total.toLocaleString("en-IN")} ready at delivery.</p>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-muted-foreground">This is a demo payment screen — no real charge is made.</p>
        </div>

        {/* Summary */}
        <aside className="rounded-lg sm:rounded-2xl border border-border/60 bg-card/60 -mx-1 sm:mx-0 px-3 py-3 sm:p-6 h-fit lg:sticky lg:top-24 space-y-2 sm:space-y-4 min-w-0">
          <h2 className="font-display text-base sm:text-2xl">Order summary</h2>
          <ul className="space-y-1 sm:space-y-2 text-[11px] sm:text-sm max-h-40 sm:max-h-56 overflow-auto">
            {items.map(({ product, qty }) => (
              <li key={product.id} className="flex items-center justify-between gap-2 sm:gap-3">
                <span className="min-w-0 truncate">{product.name} <span className="text-muted-foreground">× {qty}</span></span>
                <span className="tabular-nums shrink-0">₹{(product.price * qty).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-sm border-t border-border/60 pt-2 sm:pt-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-primary"><span>{promoObj?.code ?? "Discount"}</span><span>−₹{discount.toLocaleString("en-IN")}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
          </div>
          <div className="border-t border-border/60 pt-2 sm:pt-4 flex justify-between items-baseline">
            <span className="text-xs sm:text-base">Total</span>
            <span className="font-display text-lg sm:text-2xl">₹{total.toLocaleString("en-IN")}</span>
          </div>
          <Button size="sm" className="w-full h-10 text-sm sm:h-11 sm:text-base" loading={processing} onClick={pay}>
            {method === "cod" ? "Place order" : `Pay ₹${total.toLocaleString("en-IN")}`}
          </Button>
        </aside>

      </div>
    </div>
  );
}

function MockField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-background/50 p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <MockInput placeholder={placeholder} />
    </div>
  );
}

function MockInput({ placeholder }: { placeholder: string }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full bg-transparent border-0 border-b border-border/60 focus:border-primary outline-none py-1.5 text-sm placeholder:text-muted-foreground/60"
    />
  );
}
