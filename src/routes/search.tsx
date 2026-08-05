import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { SearchIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { products } from "@/lib/mock-data";
import { ProductCard } from "@/components/site/ProductCard";
import { BackButton } from "@/components/site/BackButton";

const schema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Search — FEED POINT" },
      { name: "description", content: "Search fresh sarson khali, cold-pressed cake and cattle feed blends." },
      { property: "og:title", content: "Search — FEED POINT" },
      { property: "og:description", content: "Find the right khali sack for your herd." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [value, setValue] = useState(q);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sync local input if URL changes externally
  useEffect(() => {
    setValue(q);
  }, [q]);

  // Debounce URL update
  useEffect(() => {
    const t = setTimeout(() => {
      if (value !== q) navigate({ search: { q: value }, replace: true });
    }, 200);
    return () => clearTimeout(t);
  }, [value, q, navigate]);

  const results = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => {
      const hay = [p.name, p.category, p.tagline, p.description, ...p.details]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [value]);

  const isSearching = value.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-4 pb-10 sm:py-20">
      <BackButton />
      <div className="mt-4 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Search the mill</p>
        <h1 className="mt-2 font-display text-2xl sm:text-5xl">What are you looking for?</h1>
      </div>

      <div className="mt-8 relative">
        <SearchIcon size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Try 'sarson khali', 'buffalo blend', '50kg'…"
          className="w-full h-14 rounded-full border border-border/60 bg-card/50 pl-12 pr-12 text-base outline-none focus:border-primary transition placeholder:text-muted-foreground/70"
        />
        {value && (
          <button
            onClick={() => setValue("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <span>
          {isSearching
            ? `${results.length} match${results.length === 1 ? "" : "es"} for "${value.trim()}"`
            : `Showing all ${results.length} sacks`}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-3 text-center animate-float-up">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-border/60 bg-card/60 text-muted-foreground">
            <SearchIcon size={20} />
          </div>
          <p className="font-display text-2xl">Kuch nahi mila</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            "{value.trim()}" ke liye koi sack nahi hai. Category ka naam try karo — "sarson khali", "buffalo", "bulk".
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
          {results.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
