import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { BookmarkIcon, ShoppingBagIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { products } from "@/lib/mock-data";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { ProductCard } from "@/components/site/ProductCard";


export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Saved Sacks — FEED POINT" },
      { name: "description", content: "Your saved mustard cake and cattle feed sacks — ready to reorder from the mill." },
      { property: "og:title", content: "Saved Sacks — FEED POINT" },
      { property: "og:description", content: "Your saved items on FEED POINT." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids, remove, clear } = useWishlist();
  const { add } = useCart();
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-20">
      <div className="flex items-end justify-between gap-2 sm:gap-6 flex-wrap">

        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Saved for later</p>
          <h1 className="mt-1 sm:mt-2 font-display text-2xl sm:text-5xl">Your saved sacks</h1>
          <p className="mt-1 sm:mt-3 text-sm sm:text-base text-muted-foreground">
            {items.length === 0
              ? "Bookmark any sack from the shop and it will show up here."
              : `${items.length} sack${items.length === 1 ? "" : "s"} waiting for your next order.`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-destructive transition"
          >
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center animate-float-up">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <BookmarkIcon size={24} />
          </div>
          <p className="font-display text-2xl">Kuch save nahi kiya abhi</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Shop pe jaake bookmark icon dabao — jo sacks pasand hain woh yahan miljayenge.
          </p>
          <Link
            to="/shop"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110 transition"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
            {items.map((p, i) => (
              <div key={p.id} className="relative group">
                <ProductCard product={p} index={i} />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    add(p);
                  }}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-sm border border-border/60 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/50 transition"
                >
                  <AnimatedIcon icon={ShoppingBagIcon} size={12} /> Add to order
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    remove(p.id);
                  }}
                  aria-label="Remove from saved"
                  className="absolute -top-2 -left-2 grid h-7 w-7 place-items-center rounded-full bg-background border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/60 transition opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
