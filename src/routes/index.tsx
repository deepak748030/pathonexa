import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sprout, Leaf, Truck, Award } from "lucide-react";
import { StarIcon, PhoneIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProductCard } from "@/components/site/ProductCard";
import { Reviews } from "@/components/site/Reviews";
import { TrustBadges } from "@/components/site/TrustBadges";
import { products, collections } from "@/lib/mock-data";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FEED POINT — Sarson Khali & Cattle Feed for Buffaloes and Cows" },
      { name: "description", content: "Fresh-pressed mustard oil cake (sarson khali) and balanced cattle feed blends for buffaloes and cows. Milled weekly, delivered to your farm." },
      { property: "og:title", content: "FEED POINT — Sarson Khali for Dairy Farms" },
      { property: "og:description", content: "Mustard cake and cattle feed, fresh from the mill." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <>
      <Hero />
      <TrustBadges />
      <FeaturedCollections />
      <Bestsellers />
      <Reviews />
      <Features />
      <Newsletter />
    </>
  );
}

function Typewriter({ phrases, typingSpeed = 70, deletingSpeed = 40, pause = 1600 }: { phrases: string[]; typingSpeed?: number; deletingSpeed?: number; pause?: number }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];
    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(() => {
      setText((prev) =>
        deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
      );
    }, deleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(t);
  }, [text, deleting, index, phrases, typingSpeed, deletingSpeed, pause]);

  return (
    <span>
      <span className="italic text-primary">{text}</span>
      <span className="inline-block w-[0.06em] h-[0.9em] align-[-0.1em] ml-1 bg-primary animate-pulse" />
    </span>
  );
}

function Hero() {
  
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={hero} alt="" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-10 pb-12 sm:pt-32 sm:pb-40 lg:pt-40 lg:pb-56">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur px-3 py-1 text-xs text-primary animate-float-up">
            <Sprout className="h-3 w-3" /> Ghani chali — is hafte ki taazi peraayi
          </div>
          <h1 className="mt-6 font-display text-3xl sm:text-6xl lg:text-8xl leading-[0.95] text-foreground animate-float-up min-h-[4.4em] sm:min-h-[2.6em] lg:min-h-[2.1em]" style={{ animationDelay: "120ms" }}>
            <Typewriter
              phrases={[
                "Sarson ki khali, seedhi ghani se.",
                "Taazi peraayi, har hafte mill se.",
                "Bhains ka doodh, ab aur gaadha.",
                "Gaay ki taakat, saal bhar kaayam.",
              ]}
            />
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed animate-float-up" style={{ animationDelay: "220ms" }}>
            Teen peedhi purani mill se — sarson pel ke jo khal bachta hai, garam aur taaza. Bhains doodh gaadha deti hai, gaay saal bhar taakat mein rehti hai.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 animate-float-up" style={{ animationDelay: "320ms" }}>
            <Button asChild size="xl" className="group relative overflow-hidden shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5 h-10 px-4 text-sm sm:h-14 sm:px-8 sm:text-base">
              <Link to="/shop">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
                <span className="relative">Order khali</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button asChild size="xl" variant="outline" className="group bg-transparent border-white text-white hover:bg-white/10 hover:text-white h-10 px-4 text-sm sm:h-14 sm:px-8 sm:text-base">
              <Link to="/how-we-mill-it">
                How we mill it
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>


          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-widest text-muted-foreground animate-float-up" style={{ animationDelay: "420ms" }}>
            <span className="flex items-center gap-2"><StarIcon size={12} className="fill-primary text-primary" /> 2,100+ dairy farms</span>
            <span className="flex items-center gap-2"><PhoneIcon size={12} /> +91 98765 43210</span>
            <span className="hidden sm:inline">Order ₹5,000+ · free delivery</span>
          </div>

        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 h-10 w-px bg-gradient-to-b from-primary/70 to-transparent" />
    </section>
  );
}

function FeaturedCollections() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 sm:py-24">
      <div className="flex items-end justify-between gap-6 mb-4 sm:mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">From the Mill</p>
          <h2 className="mt-2 font-display text-2xl sm:text-5xl">Feed for every herd</h2>
        </div>
        <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition group">
          Browse all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid gap-1.5 sm:gap-2 md:grid-cols-3">
        {collections.map((c, i) => (
          <Link
            key={c.slug}
            to="/shop"
            className="group relative overflow-hidden rounded-md aspect-[16/6] sm:aspect-[16/10] block animate-float-up"

            style={{ animationDelay: `${i * 100}ms` }}
          >
            <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
              <h3 className="font-display text-xl sm:text-3xl text-ivory">{c.title}</h3>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-ivory/70 max-w-xs">{c.copy}</p>
              <span className="mt-2 sm:mt-4 hidden sm:inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary opacity-0 -translate-x-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Bestsellers() {
  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 py-8 sm:py-24">
      <div className="flex items-end justify-between gap-6 mb-4 sm:mb-10 px-1 sm:px-0">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Farmer Favourites</p>
          <h2 className="mt-2 font-display text-2xl sm:text-5xl">Bestsellers</h2>
        </div>
        <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition group">
          See all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
        {products.slice(0, 8).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
      <div className="mt-4 sm:mt-10 flex justify-center px-1 sm:px-0">
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-border/60 px-6 py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/50 transition"
        >
          See more <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}


function Features() {
  const items = [
    { icon: Leaf, title: "Har hafte peraayi", copy: "Weekly milled — godaam mein baithe purana maal nahi bhejte." },
    { icon: Award, title: "Lab checked", copy: "Har batch protein aur residual oil ke liye tested." },
    { icon: Truck, title: "Gate tak delivery", copy: "Seedhe farm ke darwaze tak. ₹5,000+ par free." },
    { icon: Sprout, title: "Dairy ka bharosa", copy: "2,100+ chalu dairy farms iska istemal karte hain." },
  ];

  return (
    <section className="border-y border-border/60 bg-card/40 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-20">
        <div className="max-w-2xl mb-4 sm:mb-14">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">Why FEED POINT</p>
          <h2 className="mt-1 sm:mt-2 font-display text-xl sm:text-5xl">Feed you can stand behind</h2>
        </div>
        <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, copy }, i) => (
            <div
              key={title}
              className="group rounded-lg sm:rounded-2xl border border-border/60 bg-background/40 p-3 sm:p-6 transition-all duration-500 hover:border-primary/40 hover:-translate-y-1 hover:bg-background/70 animate-float-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="grid h-8 w-8 sm:h-12 sm:w-12 place-items-center rounded-lg sm:rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all group-hover:rotate-6">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="mt-2 sm:mt-5 font-display text-sm sm:text-xl">{title}</h3>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-muted-foreground leading-snug sm:leading-relaxed">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

  );
}

function Newsletter() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    await new Promise((r) => setTimeout(r, 1200));
    setState("done");
  };
  return (
    <section className="mx-auto max-w-4xl px-6 py-10 sm:py-28 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">The Mill Note</p>
      <h2 className="mt-3 font-display text-2xl sm:text-5xl leading-tight">Pressing dates, once a month.</h2>
      <p className="mt-4 text-muted-foreground max-w-lg mx-auto">Batch schedules, farm tips and price alerts — sent when there's something worth telling.</p>
      <form onSubmit={submit} className="mt-8 grid grid-cols-[1fr_auto] gap-2 max-w-md mx-auto">
        <input
          type="email"
          required
          placeholder="your@farm.com"
          className="h-12 min-w-0 rounded-full border border-border/60 bg-background/50 px-5 text-sm outline-none focus:border-primary transition"
        />
        <Button size="lg" type="submit" loading={state === "loading"}>
          {state === "done" ? "Subscribed ✓" : "Subscribe"}
        </Button>
      </form>
      {state === "done" && (
        <p className="mt-4 text-sm text-primary animate-float-up">You're on the mill list.</p>
      )}
      {state === "loading" && (
        <p className="mt-4 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Spinner size={12} /> Adding you…
        </p>
      )}
    </section>
  );
}
