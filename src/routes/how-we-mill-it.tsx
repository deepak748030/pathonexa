import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sprout, Droplet, PackageCheck, Truck, Award } from "lucide-react";
import { FlameIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";


export const Route = createFileRoute("/how-we-mill-it")({
  head: () => ({
    meta: [
      { title: "How We Mill It — FEED POINT" },
      { name: "description", content: "Dekhiye kaise FEED POINT ki ghani mein sarson se taazi khali banti hai — sourcing, cleaning, cold pressing, cooling aur packing tak." },
      { property: "og:title", content: "How We Mill It — FEED POINT" },
      { property: "og:description", content: "Sarson se sack tak — hamari milling process ki poori kahani." },
    ],
  }),
  component: HowWeMillIt,
});

const steps = [
  {
    icon: Sprout,
    tag: "Step 01",
    title: "Sarson sourcing",
    copy: "Rajasthan aur Haryana ke chosen farmers se black aur yellow mustard seeds. Har lot moisture aur oil content ke liye check hoti hai — jo pass nahi hoti, wapas jaati hai.",
  },
  {
    icon: Droplet,
    tag: "Step 02",
    title: "Cleaning & grading",
    copy: "De-stoning, sieving aur air separation. Dhool, patthar aur halke daane nikal jaate hain — sirf full-bodied seeds ghani tak pahunchte hain.",
  },
  {
    icon: FlameIcon,
    tag: "Step 03",
    title: "Cold pressing (ghani)",
    copy: "Wooden kolhu aur slow-speed expeller. Kam heat, kam oxidation — oil alag, aur peeche reh jaati hai warm, nutrient-rich khali.",
  },
  {
    icon: PackageCheck,
    tag: "Step 04",
    title: "Cooling & lab check",
    copy: "Fresh khali ko controlled cooling milti hai. Har batch ka protein %, residual oil aur AFB1 (aflatoxin) tested — reports batch code se linked.",
  },
  {
    icon: Truck,
    tag: "Step 05",
    title: "Pack & dispatch",
    copy: "40kg aur 50kg jute-lined sacks, batch date printed. Order milte hi ghani se seedhi gaadi mein — farm gate tak 24–72 ghante mein.",
  },
];

function HowWeMillIt() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 pb-6 sm:pt-16 sm:pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs text-primary">
            <Sprout className="h-3 w-3" /> Seed to sack
          </div>
          <h1 className="mt-3 sm:mt-6 font-display text-2xl sm:text-7xl leading-[0.95]">
            How we <span className="italic text-primary">mill</span> it.
          </h1>
          <p className="mt-2 sm:mt-6 text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Teen peedhi purani ghani, aaj bhi wahi tehzeeb. Sarson ke daane se lekar farm ke darwaze tak — har step aap dekh sakte hain.
          </p>
        </div>

      </section>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:pt-6 sm:pb-24">
        <div className="relative">
          <div className="absolute left-5 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-border to-transparent -translate-x-0 sm:-translate-x-1/2" aria-hidden />
          <div className="space-y-6 sm:space-y-20">
            {steps.map(({ icon: Icon, tag, title, copy }, i) => (
              <div
                key={tag}
                className={`relative grid gap-6 sm:grid-cols-2 sm:gap-16 items-center animate-float-up ${
                  i % 2 === 1 ? "sm:[&>*:first-child]:order-2" : ""
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="pl-14 sm:pl-0 sm:text-right sm:pr-10">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">{tag}</p>
                  <h3 className="mt-1 sm:mt-2 font-display text-lg sm:text-4xl">{title}</h3>
                  <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">{copy}</p>
                </div>

                <div className="absolute left-0 sm:left-1/2 top-0 -translate-x-0 sm:-translate-x-1/2 group">
                  <div className="grid h-9 w-9 sm:h-12 sm:w-12 place-items-center rounded-full border border-primary/40 bg-background text-primary shadow-lg shadow-primary/10 transition-all group-hover:scale-110 group-hover:shadow-primary/30">
                    {Icon === FlameIcon ? <AnimatedIcon icon={Icon} size={16} /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                </div>

                <div className="hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-20 grid gap-3 sm:gap-8 sm:grid-cols-3">
          {[
            { icon: Award, title: "Lab-tested every batch", copy: "Protein, residual oil, AFB1 — reports batch code se milte hain.", animated: false },
            { icon: FlameIcon, title: "Slow, cold pressing", copy: "Wooden kolhu heat kam rakhta hai — nutrients kaayam.", animated: true },
            { icon: Truck, title: "Fresh dispatch only", copy: "Milled weekly. Godaam mein baithe purana maal nahi bhejte.", animated: false },
          ].map(({ icon: Icon, title, copy, animated }) => (
            <div key={title} className="group rounded-lg sm:rounded-2xl border border-border/60 bg-background/40 p-3 sm:p-6 transition-all hover:border-primary/40 hover:-translate-y-1">
              <div className="grid h-8 w-8 sm:h-11 sm:w-11 place-items-center rounded-lg sm:rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {animated ? <AnimatedIcon icon={Icon} size={16} /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </div>
              <h4 className="mt-2 sm:mt-4 font-display text-sm sm:text-xl">{title}</h4>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-muted-foreground leading-snug">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:pt-6 sm:pb-24 text-center">
        <h2 className="font-display text-xl sm:text-5xl">Ab jab process dekh li,</h2>
        <p className="mt-2 sm:mt-4 text-xs sm:text-base text-muted-foreground">is hafte ki ghani se seedha apne farm ke liye order kariye.</p>
        <div className="mt-3 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
          <Button asChild size="sm" className="sm:h-14 sm:px-10 sm:text-base">
            <Link to="/shop">Order khali <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" /></Link>
          </Button>
          <Button asChild size="sm" variant="muted" className="sm:h-14 sm:px-10 sm:text-base">
            <Link to="/">Wapas home</Link>
          </Button>
        </div>
      </section>

    </>
  );
}
