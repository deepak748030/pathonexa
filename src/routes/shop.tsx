import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { products } from "@/lib/mock-data";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, Sprout } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";




export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Sarson Khali & Cattle Feed — FEED POINT" },
      { name: "description", content: "Browse fresh mustard oil cake (sarson khali), buffalo blends, cow feed and bulk sacks. Milled weekly, delivered to your farm." },
      { property: "og:title", content: "Shop — FEED POINT" },
      { property: "og:description", content: "Mustard cake and cattle feed for buffaloes and cows." },
    ],
  }),
  component: Shop,
});

const cats = ["All", "Sarson Khali", "Cold-Pressed", "Kolhu", "Buffalo Feed", "Cow Feed", "Bulk"];

function Shop() {
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const PAGE = 8;
  const [visible, setVisible] = useState(PAGE);
  const [fetchingMore, setFetchingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setVisible(PAGE);
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [cat, sort]);

  const list = useMemo(() => {
    // Build a larger catalogue by cycling the base products a few times
    // (each cycle re-keyed and lightly re-priced) so infinite scroll has
    // enough content to demonstrate.
    const base = cat === "All" ? products : products.filter((p) => p.category === cat);
    const pool = [0, 1, 2, 3, 4].flatMap((cycle) =>
      base.map((p) => ({
        ...p,
        id: `${p.id}-${cycle}`,
        price: p.price + cycle * 20,
        mrp: p.mrp ? p.mrp + cycle * 20 : undefined,
      })),
    );
    let l = pool;
    if (sort === "price-asc") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [cat, sort]);

  const shown = list.slice(0, visible);
  const hasMore = visible < list.length;
  const atEnd = !loading && !hasMore && list.length > 0;

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fetchingMore) {
          setFetchingMore(true);
          setTimeout(() => {
            setVisible((v) => Math.min(v + PAGE, list.length));
            setFetchingMore(false);
          }, 600);
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, fetchingMore, list.length]);


  return (
   <div className="mx-auto max-w-7xl px-3 sm:px-6 py-0 sm:pb-24 sm:pt-6">
     <div className="border-b sm:border-y border-border/60 py-3 sm:py-4 flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3 sm:items-center">

        <div className="flex gap-2 overflow-x-auto no-scrollbar min-w-0 -mx-3 px-3 sm:mx-0 sm:px-0">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] sm:text-xs uppercase tracking-widest transition-all",
                cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground sm:hidden">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Sort
          </span>
          <SlidersHorizontal className="hidden sm:block h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="h-9 w-[140px] border-border/60 bg-transparent text-sm hover:text-primary hover:border-primary/50 transition focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60 text-foreground">
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price ↑</SelectItem>
              <SelectItem value="price-desc">Price ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>



      <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : shown.map((p, i) => <ProductCard key={p.id} product={p} index={i % PAGE} />)}
        {fetchingMore &&
          Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`f-${i}`} />)}
      </div>

      {hasMore && !loading && <div ref={sentinelRef} className="h-10 mt-8" aria-hidden />}

      {fetchingMore && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <Spinner size={12} /> Ghani se aur khali la rahe hain…
        </div>
      )}

      {atEnd && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center animate-float-up">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Sprout className="h-5 w-5" />
          </div>
          <p className="font-display text-2xl">Bas, aaj ka stock itna hi.</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            You've reached the end — {list.length} sacks from this week's pressing. Agli batch agle mangalwaar.
          </p>
          <div className="mt-2 h-px w-24 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        </div>
      )}

      {!loading && list.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">Nothing in this category right now.</p>
      )}
    </div>
  );
}

