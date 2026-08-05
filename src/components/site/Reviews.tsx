import { Quote, Star } from "lucide-react";

import r1 from "@/assets/review-1.jpg";
import r2 from "@/assets/review-2.jpg";
import r3 from "@/assets/review-3.jpg";

const reviews = [
  {
    name: "Ramesh Yadav",
    role: "Dairy farmer · Mathura, UP",
    photo: r1,
    stars: 5,
    quote:
      "Do saal se FEED POINT hi le raha hoon. Bhains ka doodh pehle 8 litre tha, ab 11 litre tak aa gaya. Khali garam aur khushbudaar hoti hai — samajh aa jaata hai fresh peraayi ki hai.",
  },
  {
    name: "Sunita Devi",
    role: "Gaushala manager · Rohtak, Haryana",
    photo: r2,
    stars: 5,
    quote:
      "40 gaayein hain humari gaushala mein. Pehle local mandi se leti thi, quality upar-neeche rehti thi. FEED POINT se har hafte wahi taazi khali milti hai. Gaayein bhi zyaada khaati hain isse.",
  },
  {
    name: "Vikram Singh Jat",
    role: "Buffalo farm owner · Karnal",
    photo: r3,
    stars: 5,
    quote:
      "Cold-pressed wala 25kg sack try kiya, seedha farak pada. Bhainso ke baal chamakne lage, sardi mein bhi doodh nahi gira. Bulk mein order karta hoon ab — 100kg sack ka rate best hai.",
  },
];

export function Reviews() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-24">
      <div className="max-w-2xl mb-4 sm:mb-14">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">Farmers ki zubaani</p>
        <h2 className="mt-1 sm:mt-2 font-display text-xl sm:text-5xl">Doodh badha, ghar chala.</h2>
        <p className="mt-1.5 sm:mt-3 text-xs sm:text-base text-muted-foreground max-w-xl">Real dairy farmers, real farms. Sab reviews Google verified purchases se.</p>
      </div>

      <div className="grid gap-3 sm:gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <figure
            key={r.name}
            className="group relative flex flex-col rounded-lg sm:rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-3 sm:p-8 transition-all duration-500 hover:border-primary/40 hover:-translate-y-1 animate-float-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Quote className="absolute top-3 right-3 sm:top-5 sm:right-5 h-5 w-5 sm:h-8 sm:w-8 text-primary/15 group-hover:text-primary/30 transition" />

            <div className="flex gap-0.5 text-primary">
              {Array.from({ length: r.stars }).map((_, k) => (
                <Star key={k} className="h-3.5 w-3.5 fill-primary stroke-primary" />
              ))}
            </div>


            <blockquote className="mt-2 sm:mt-4 text-xs sm:text-[15px] leading-relaxed text-foreground/90 flex-1">
              "{r.quote}"
            </blockquote>

            <figcaption className="mt-3 sm:mt-6 flex items-center gap-2 sm:gap-3 pt-3 sm:pt-6 border-t border-border/50">
              <img
                src={r.photo}
                alt={r.name}
                loading="lazy"
                width={80}
                height={80}
                className="h-8 w-8 sm:h-12 sm:w-12 rounded-full object-cover border border-border/60"
              />
              <div className="min-w-0">
                <p className="font-display text-xs sm:text-base truncate">{r.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{r.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-4 sm:mt-12 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-muted-foreground">
        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="flex text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-primary stroke-primary" />
            ))}
          </span>
          4.9 average · 1,240+ reviews
        </span>
        <span>2,100+ dairy farms</span>
        <span>62 saal ki mill</span>
      </div>
    </section>

  );
}
