import { Link } from "@tanstack/react-router";
import { Youtube } from "lucide-react";
import { InstagramIcon, TwitterIcon, MailIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import logo from "@/assets/logo.png";

export function Footer() {
  const cols: { title: string; links: { label: string; to: string }[] }[] = [
    {
      title: "Shop",
      links: [
        { label: "Sarson Khali", to: "/shop" },
        { label: "Cold-Pressed", to: "/shop" },
        { label: "Buffalo Feed", to: "/shop" },
        { label: "Cow Feed", to: "/shop" },
        { label: "Bulk", to: "/shop" },
      ],
    },
    {
      title: "The Mill",
      links: [
        { label: "Our Story", to: "/about" },
        { label: "How We Mill It", to: "/how-we-mill-it" },
        { label: "Farmer Reviews", to: "/#reviews" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQ", to: "/faq" },
        { label: "Delivery & Bulk", to: "/faq" },
        { label: "My Orders", to: "/orders" },
      ],
    },
  ];
  return (
    <footer className="border-t border-border/60 mt-8 sm:mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-[2fr_3fr]">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-10 w-10" />
            <span className="font-display text-2xl">Feed<span className="text-primary">Point</span></span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Fresh-pressed sarson khali and cattle feed for buffaloes and cows. Milled weekly, delivered to your farm.
          </p>
          <div className="mt-6 flex gap-2">
            {([
              { Icon: InstagramIcon, animated: true },
              { Icon: TwitterIcon, animated: true },
              { Icon: Youtube, animated: false },
              { Icon: MailIcon, animated: true },
            ] as const).map(({ Icon, animated }, i) => (
              <a
                key={i}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-full border border-border/60 text-muted-foreground transition hover:border-primary hover:text-primary hover:-translate-y-0.5"
              >
                {animated ? <AnimatedIcon icon={Icon} size={16} /> : <Icon className="h-4 w-4" />}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm uppercase tracking-widest text-primary/80">{c.title}</h4>
              <ul className="mt-4 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} FEED POINT. Fresh from the mill.</span>
          <span>Pressed weekly. Delivered to your gate.</span>
        </div>
      </div>
    </footer>
  );
}
