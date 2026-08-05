import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { PROMOS } from "@/lib/cart-context";
import { ArrowLeft, Tag, Check, Percent, IndianRupee, Truck } from "lucide-react";
import { BackButton } from "@/components/site/BackButton";
import { toast } from "sonner";

export const Route = createFileRoute("/promos")({
  head: () => ({
    meta: [
      { title: "Available Coupons — FEED POINT" },
      { name: "description", content: "Browse and apply available promo codes." },
    ],
  }),
  component: PromosPage,
});

function PromosPage() {
  const { subtotal, applyPromo, promoObj } = useCart();
  const navigate = useNavigate();

  const handleApply = (code: string) => {
    const p = applyPromo(code);
    if (p) {
      toast.success(`Promo applied: ${p.label}`);
      navigate({ to: "/cart" });
    } else {
      toast.error("This coupon isn't eligible for your current order");
    }
  };

  const iconFor = (kind: string) => {
    if (kind === "percent") return <Percent className="h-5 w-5" />;
    if (kind === "flat") return <IndianRupee className="h-5 w-5" />;
    return <Truck className="h-5 w-5" />;
  };

  const benefitText = (p: (typeof PROMOS)[number]) => {
    if (p.kind === "percent") return `${p.value}% OFF`;
    if (p.kind === "flat") return `₹${p.value} OFF`;
    return "FREE DELIVERY";
  };

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 sm:pt-6 sm:pb-24">
      <div className="flex items-center justify-between gap-3 sm:block">
        <BackButton />
        <p className="sm:hidden text-xs uppercase tracking-[0.3em] text-primary">Coupons</p>
      </div>
      <p className="hidden sm:block mt-3 sm:mt-6 text-xs uppercase tracking-[0.3em] text-primary">Coupons</p>
      <h1 className="hidden sm:block mt-2 font-display text-2xl sm:text-5xl">Available offers</h1>
      <p className="hidden sm:block mt-3 text-muted-foreground">Tap apply to use a coupon on your current order.</p>

      <ul className="mt-4 sm:mt-10 space-y-0">
        {PROMOS.map((p) => {
          const eligible = !p.minSubtotal || subtotal >= p.minSubtotal;
          const active = promoObj?.code === p.code;
          return (
            <li
              key={p.code}
              onClick={() => eligible && !active && handleApply(p.code)}
              className={`group relative rounded-md border border-border/60 bg-card/50 p-2.5 sm:p-6 flex items-center gap-3 sm:gap-5 hover:border-primary/50 transition -mt-px first:mt-0 ${eligible && !active ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="h-8 w-8 sm:h-12 sm:w-12 shrink-0 rounded-full border border-dashed border-primary/50 text-primary grid place-items-center">
                {iconFor(p.kind)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 text-primary px-2 py-0.5 text-[11px] uppercase tracking-widest font-mono">
                    <Tag className="h-3 w-3" /> {p.code}
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{benefitText(p)}</span>
                </div>
                <p className="mt-0.5 sm:mt-1.5 font-display text-sm sm:text-lg">{p.label}</p>
                {p.minSubtotal && (
                  <p className={`text-xs mt-0.5 ${eligible ? "text-muted-foreground" : "text-destructive"}`}>
                    Min. order ₹{p.minSubtotal.toLocaleString("en-IN")}
                    {!eligible && ` — add ₹${(p.minSubtotal - subtotal).toLocaleString("en-IN")} more`}
                  </p>
                )}
              </div>
              {active ? (
                <span className="inline-flex items-center gap-1.5 text-primary text-xs uppercase tracking-widest">
                  <Check className="h-4 w-4" /> Applied
                </span>
              ) : (
                <Button size="sm" disabled={!eligible} onClick={() => handleApply(p.code)}>
                  Apply
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
