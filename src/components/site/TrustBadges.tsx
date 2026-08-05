import { Truck, RefreshCcw, Beaker } from "lucide-react";
import { ShieldCheckIcon, IndianRupeeIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";

const badges = [
  { icon: Beaker, title: "Lab tested", copy: "Har batch protein & oil verified", animated: false },
  { icon: Truck, title: "Free delivery", copy: "₹5,000+ ke order pe", animated: false },
  { icon: RefreshCcw, title: "48-hr guarantee", copy: "Kharaab nikli? Full refund", animated: false },
  { icon: IndianRupeeIcon, title: "COD available", copy: "₹10,000 tak", animated: true },
  { icon: ShieldCheckIcon, title: "FSSAI licensed", copy: "Lic. 12345678901234", animated: true },
] as const;

export function TrustBadges() {
  return (
    <section className="border-y border-border/60 bg-card/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-6">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-2 sm:gap-x-8 sm:gap-y-4">
          {badges.map(({ icon: Icon, title, copy, animated }, i) => (
            <li
              key={title}
              className="group flex items-center gap-2 sm:gap-3 animate-float-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="grid h-7 w-7 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-6">
                {animated ? <AnimatedIcon icon={Icon} size={14} triggerSelector="li" /> : <Icon className="h-3 w-3 sm:h-4 sm:w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[13px] font-medium leading-tight truncate">{title}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight truncate">{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
