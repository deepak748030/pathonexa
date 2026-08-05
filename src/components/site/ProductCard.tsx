import { Link } from "@tanstack/react-router";
import { BookmarkIcon, PlusIcon, SparklesIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { useState } from "react";
import type { Product } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(0);
  const saved = has(product.id);

  const quickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    add(product);
    setLoading(false);
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    setBurst((b) => b + 1);
  };



  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block animate-float-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative overflow-hidden rounded-md bg-card aspect-[4/5]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent opacity-70" />

        <button
          onClick={toggleSave}
          aria-label={saved ? "Remove from saved" : "Save for later"}
          className={cn(
            "absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md border transition-all duration-300 overflow-visible",
            saved
              ? "bg-primary text-primary-foreground border-primary shadow-[0_6px_20px_-6px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
              : "bg-background/60 text-foreground border-border/50 hover:bg-background hover:border-primary/60",
          )}
        >
          <AnimatedIcon
            key={burst}
            icon={BookmarkIcon}
            size={16}
            className={cn("leaf-pop", saved && "[&_svg]:fill-current")}
          />
          {saved && (
            <SparklesIcon
              key={`s-${burst}`}
              size={12}
              className="pointer-events-none absolute -top-1 -right-1 text-primary sparkle-out"
            />
          )}
        </button>


        <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-[9px] uppercase tracking-[0.2em] text-ivory/80 truncate">{product.category}</span>
          <button
            onClick={quickAdd}
            disabled={loading}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-sm bg-primary px-2.5 text-[11px] font-medium text-primary-foreground shadow-md transition hover:brightness-110 disabled:opacity-70"
          >
            {loading ? <Spinner size={11} /> : <AnimatedIcon icon={PlusIcon} size={12} />}
            {loading ? "Adding" : "Add"}
          </button>
        </div>

      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 font-sans text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors tracking-tight">
            {product.name}
          </h3>
          <span className="shrink-0 font-sans text-base sm:text-lg font-semibold text-foreground tabular-nums tracking-tight">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {product.category}
          </p>
          {product.mrp && product.mrp > product.price && (
            <span className="shrink-0 font-sans text-xs tabular-nums text-destructive line-through decoration-destructive/70">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>




    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[4/5] rounded-md shimmer" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-2/3 rounded shimmer" />
        <div className="h-3 w-1/3 rounded shimmer" />
      </div>
    </div>
  );
}
