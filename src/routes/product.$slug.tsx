import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-context";
import { ProductCard } from "@/components/site/ProductCard";
import { Check, Minus, Plus, Shield, Truck, RotateCcw, ArrowLeft } from "lucide-react";


export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Out of stock — FEED POINT" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.product;
    return {
      meta: [
        { title: `${p.name} — FEED POINT` },
        { name: "description", content: p.tagline },
        { property: "og:title", content: `${p.name} — FEED POINT` },
        { property: "og:description", content: p.tagline },
        { property: "og:image", content: p.image },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <h1 className="font-display text-4xl">Out of stock</h1>
      <p className="mt-3 text-muted-foreground">This sack is between pressings.</p>
      <Link to="/shop" className="mt-6 inline-block text-primary underline">Back to shop</Link>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const [ready, setReady] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, [product.id]);

  const addToCart = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    add(product, qty);
    setLoading(false);
  };

  const related = products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-16 overflow-x-hidden">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">

        <div className="space-y-2">
          {ready ? (
            <div className="relative rounded-md overflow-hidden bg-card animate-float-up">
              <img
                key={activeImg}
                src={product.image}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover animate-fade-in"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show image ${i + 1}`}
                    onClick={() => setActiveImg(i)}
                    className={`pointer-events-auto rounded-full transition-all shadow ${activeImg === i ? "h-2.5 w-6 bg-primary" : "h-2.5 w-2.5 bg-white/70 hover:bg-white"}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md aspect-[4/5] shimmer" />
          )}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) =>
              ready ? (
                <button
                  type="button"
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`rounded-sm overflow-hidden bg-card aspect-square cursor-pointer ring-1 transition hover-scale ${activeImg === i ? "ring-primary" : "ring-transparent hover:ring-primary/60"}`}
                >
                  <img src={product.image} alt="" className="w-full h-full object-cover" />
                </button>
              ) : (
                <div key={i} className="rounded-sm aspect-square shimmer" />
              ),
            )}
          </div>
        </div>

        <div className="min-w-0">
          {ready ? (
            <div className="animate-float-up min-w-0 flex flex-col">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">{product.category}</p>
              <h1 className="mt-3 font-sans text-2xl sm:text-4xl font-semibold leading-tight tracking-tight break-words">{product.name}</h1>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground break-words">{product.tagline}</p>
              <div className="mt-6 flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <p className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">₹{product.price.toLocaleString("en-IN")}</p>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <p className="font-sans text-base sm:text-lg text-destructive line-through decoration-destructive/70 tabular-nums">₹{product.mrp.toLocaleString("en-IN")}</p>
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>



              <p className="order-2 sm:order-1 mt-8 text-sm sm:text-base text-foreground/85 leading-relaxed break-words">{product.description}</p>

              <ul className="order-3 sm:order-2 mt-6 grid gap-2">
                {product.details.map((d: string) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span className="min-w-0 break-words">{d}</span>
                  </li>
                ))}
              </ul>

              <div className="order-1 sm:order-3 mt-6 sm:mt-8 flex flex-row items-center gap-3 sm:gap-4">
                <div className="inline-flex items-center rounded-full border border-border/60 bg-card shrink-0">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 sm:h-11 sm:w-11 grid place-items-center hover:text-primary transition"><Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
                  <span className="w-6 sm:w-8 text-center text-sm sm:text-base">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="h-9 w-9 sm:h-11 sm:w-11 grid place-items-center hover:text-primary transition"><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
                </div>
                <Button size="xl" loading={loading} onClick={addToCart} className="flex-1 min-w-0 h-12 sm:h-14 text-sm sm:text-base">
                  <span className="truncate">Add to cart — ₹{(product.price * qty).toLocaleString("en-IN")}</span>
                </Button>
              </div>


              <div className="order-4 mt-8 grid grid-cols-3 gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1 text-center"><Truck className="h-5 w-5 text-primary" /> Free delivery ₹5,000+</div>
                <div className="flex flex-col items-center gap-1 text-center"><Shield className="h-5 w-5 text-primary" /> Fresh-pressed guarantee</div>
                <div className="flex flex-col items-center gap-1 text-center"><RotateCcw className="h-5 w-5 text-primary" /> Replace if damaged</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-4 w-24 shimmer rounded" />
              <div className="h-12 w-3/4 shimmer rounded" />
              <div className="h-4 w-1/2 shimmer rounded" />
              <div className="h-8 w-24 shimmer rounded mt-4" />
              <div className="h-24 shimmer rounded mt-6" />
              <div className="h-12 shimmer rounded-full mt-6" />
            </div>
          )}
        </div>
      </div>

      <section className="mt-10 sm:mt-28">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Also from the mill</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">Farmers also order</h2>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </div>
  );
}
