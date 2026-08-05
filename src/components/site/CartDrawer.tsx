import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { useOrders } from "@/lib/orders-context";
import { useAddress } from "@/lib/address-context";
import { useAuth } from "@/lib/auth-context";
import { X, Tag } from "lucide-react";
import { MinusIcon, PlusIcon, ShoppingBagIcon, CheckIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function CartDrawer() {
  const { open, openDrawer, items, remove, setQty, subtotal, count, promoObj, discount, freeShip, applyPromo, clearPromo } = useCart();
  useOrders();
  const { hasAddress } = useAddress();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");

  const shipping = items.length === 0 ? 0 : freeShip || subtotal - discount >= 5000 ? 0 : 250;
  const total = Math.max(0, subtotal - discount) + shipping;

  const submitPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim();
    if (!code) return;
    const p = applyPromo(code);
    if (p) {
      toast.success(`Promo applied: ${p.label}`);
      setPromoInput("");
    } else {
      toast.error("Invalid or ineligible promo code");
    }
  };

  const checkout = async () => {
    if (!user) {
      openDrawer(false);
      navigate({ to: "/auth", search: { redirect: "/cart", checkout: "1" } });
      toast("Sign in to continue checkout", { description: "We'll bring you back after login." });
      return;
    }
    if (items.length === 0) return;
    setCheckoutLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setCheckoutLoading(false);
    openDrawer(false);
    if (!hasAddress) {
      toast("Add a delivery address to continue");
      navigate({ to: "/checkout/address" });
    } else {
      navigate({ to: "/checkout/payment" });
    }
  };


  return (
    <Sheet open={open} onOpenChange={openDrawer}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-background border-l border-border/60 gap-0 p-0">
        <SheetHeader className="border-b border-border/60 p-6 pr-14">
          <SheetTitle className="font-sans text-xs uppercase tracking-[0.32em] font-semibold flex items-center gap-2">
            <ShoppingBagIcon size={16} className="text-primary" /> Your Order
            <span className="ml-auto text-[11px] text-muted-foreground font-sans tracking-widest">{count} sack{count === 1 ? "" : "s"}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBagIcon size={40} className="mb-3 opacity-40" />
              <p className="font-display text-lg text-foreground">Your order is empty</p>
              <p className="text-sm mt-1">Add a sack from the shop.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map(({ product, qty }) => (
                <li key={product.id} className="grid grid-cols-[80px_1fr_auto] gap-3 py-4 items-start animate-in fade-in slide-in-from-right-4 duration-300">
                  <img src={product.image} alt={product.name} className="h-24 w-20 object-cover rounded-lg" />
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-sans tabular-nums">₹{product.price.toLocaleString("en-IN")}</p>
                    <div className="mt-2 inline-flex items-center rounded-full border border-border/60">
                      <button onClick={() => setQty(product.id, qty - 1)} className="h-7 w-7 grid place-items-center hover:text-primary transition"><AnimatedIcon icon={MinusIcon} size={12} /></button>
                      <span className="w-6 text-center text-xs">{qty}</span>
                      <button onClick={() => setQty(product.id, qty + 1)} className="h-7 w-7 grid place-items-center hover:text-primary transition"><AnimatedIcon icon={PlusIcon} size={12} /></button>
                    </div>
                  </div>
                  <button onClick={() => remove(product.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive transition p-1">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border/60 px-3 py-3 sm:p-6 space-y-2 sm:space-y-4 bg-card/40">
            {/* Promo */}
            {promoObj ? (
              <div className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-primary">
                    <CheckIcon size={14} />
                    <span className="font-medium font-mono">{promoObj.code}</span>
                  </span>
                  <button onClick={clearPromo} className="text-[11px] sm:text-xs text-muted-foreground hover:text-destructive transition">Remove</button>
                </div>
                <p className="text-[11px] sm:text-xs text-primary/90">
                  {promoObj.kind === "percent" && `${promoObj.value}% off — you save ₹${discount.toLocaleString("en-IN")}`}
                  {promoObj.kind === "flat" && `₹${promoObj.value} off — you save ₹${discount.toLocaleString("en-IN")}`}
                  {promoObj.kind === "freeship" && `Free delivery unlocked`}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  openDrawer(false);
                  navigate({ to: "/promos" });
                }}
                className="w-full flex items-center justify-between rounded-md border border-dashed border-border hover:border-primary/60 bg-background px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm transition group"
              >
                <span className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
                  <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="uppercase tracking-wider text-[10px] sm:text-xs">View available coupons</span>
                </span>
                <span className="text-[10px] sm:text-xs text-primary uppercase tracking-widest">Apply</span>
              </button>
            )}

            <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount</span>
                  <span className="tabular-nums">−₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="tabular-nums">{shipping === 0 ? "Free" : `₹${shipping}`}</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between border-t border-border/60 pt-2 sm:pt-3">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Total</span>
              <span className="font-sans text-lg sm:text-2xl font-semibold tabular-nums tracking-tight">₹{total.toLocaleString("en-IN")}</span>
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Button size="sm" className="h-10 text-sm sm:h-11 sm:text-base" loading={checkoutLoading} onClick={checkout}>
                {user ? "Proceed to Checkout" : "Sign in to Checkout"}
              </Button>
              <Button variant="muted" size="sm" className="h-10 text-sm sm:h-11 sm:text-base" onClick={() => openDrawer(false)}>Continue shopping</Button>
            </div>
          </div>

        )}

        {items.length === 0 && (
          <div className="border-t border-border/60 p-6">
            <Button variant="muted" size="lg" className="w-full" onClick={() => openDrawer(false)}>Continue shopping</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
