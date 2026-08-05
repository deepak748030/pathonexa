import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, Award, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import mill from "@/assets/mill-story.jpg";
import founder from "@/assets/founder.jpg";


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Three Generations at the Ghani | FEED POINT" },
      { name: "description", content: "FEED POINT is a three-generation family mustard mill. Meet the family, the ghani, and the farmers we press for." },
      { property: "og:title", content: "Our Story — FEED POINT" },
      { property: "og:description", content: "Three generations. One ghani. Fresh sarson khali every week." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-0 sm:pt-6 sm:pb-24">
      <div className="max-w-2xl">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary animate-float-up">Our Story</p>
        <h1 className="mt-2 sm:mt-3 font-display text-2xl sm:text-7xl leading-[0.95] animate-float-up" style={{ animationDelay: "80ms" }}>
          Teen peedhi.<br />Ek ghani.
        </h1>
        <p className="mt-3 sm:mt-6 text-sm sm:text-lg text-muted-foreground leading-relaxed animate-float-up" style={{ animationDelay: "160ms" }}>
          Since 1962, one family in a small UP town has been pressing sarson the old way — slowly, on a wooden ghani, week after week. What started as one bullock and one press today feeds 2,100+ dairy farms across the state.
        </p>
      </div>

      <div className="mt-6 sm:mt-16 relative overflow-hidden rounded-lg sm:rounded-2xl border border-border/60 animate-float-up -mx-1 sm:mx-0" style={{ animationDelay: "240ms" }}>
        <img src={mill} alt="Traditional mustard ghani inside the FEED POINT mill" className="w-full h-[200px] sm:h-[520px] object-cover" width={1600} height={1008} />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
        <div className="absolute bottom-3 left-3 sm:bottom-8 sm:left-8 right-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">Est. 1962</p>
          <p className="mt-1 sm:mt-2 font-display text-base sm:text-4xl text-ivory max-w-md">The mill still smells the way dadaji left it — warm, oily, alive.</p>
        </div>
      </div>


      <div className="mt-8 sm:mt-24 grid gap-6 sm:gap-16 md:grid-cols-[1fr_1.4fr] items-start">
        <div className="animate-float-up">
          <div className="relative overflow-hidden rounded-lg sm:rounded-2xl border border-border/60 bg-card/40">
            <img src={founder} alt="Sardar Harbhajan Singh, founder" className="w-full h-auto object-cover" width={1008} height={1200} loading="lazy" />
          </div>
          <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground">Sardar Harbhajan Singh · Founder, 1962</p>
        </div>

        <div className="space-y-4 sm:space-y-6 animate-float-up" style={{ animationDelay: "120ms" }}>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">1962 · Bapuji</p>
            <h3 className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl">Ek bullock, ek ghani.</h3>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">Grandfather set up a single wooden kolhu behind the family courtyard. Farmers in a 5-km ring brought their sarson, took back oil, and left the khali behind — that khali became our first product.</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">1988 · Papaji</p>
            <h3 className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl">Dairies ne khali maangi.</h3>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">The next generation added a second ghani and started weekly deliveries to nearby dairies. Word travelled that FEED POINT khali kept buffaloes' milk gaadha through winter.</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">Today</p>
            <h3 className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl">Har hafte, seedhi farm tak.</h3>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">Three ghanis, one cold-press line, one lab. Still batch-milled every Tuesday. Still delivered warm. Still no godaam stock — kal ka nahi, aaj ka.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-24 grid gap-3 sm:gap-4 grid-cols-3">
        {[
          { icon: Leaf, k: "62 saal", v: "Teen peedhi mill se" },
          { icon: Sprout, k: "2,100+", v: "Chalu dairy farms" },
          { icon: Award, k: "Har batch", v: "Lab tested protein & oil" },
        ].map(({ icon: Icon, k, v }, i) => (
          <div key={k} className="rounded-lg sm:rounded-2xl border border-border/60 bg-card/40 p-3 sm:p-6 animate-float-up" style={{ animationDelay: `${i * 80}ms` }}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            <p className="mt-2 sm:mt-4 font-display text-base sm:text-3xl">{k}</p>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-muted-foreground leading-tight">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 sm:mt-24 -mx-2 sm:mx-0 rounded-lg sm:rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4 sm:p-12 text-center">
        <h2 className="font-display text-lg sm:text-4xl">Ghani ke saamne aaiye.</h2>
        <p className="mt-1.5 sm:mt-3 text-xs sm:text-base text-muted-foreground max-w-lg mx-auto">Har mangalwaar peraayi hoti hai. Farm visits welcome — chai, khali, aur pura process dikhayenge.</p>
        <div className="mt-3 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          <Button asChild size="sm" className="sm:h-11 sm:px-8 sm:text-base">
            <Link to="/shop">Order this week's batch <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" /></Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="sm:h-11 sm:px-8 sm:text-base">
            <Link to="/how-we-mill-it">How we mill it <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" /></Link>
          </Button>
        </div>
      </div>

    </div>
  );
}
