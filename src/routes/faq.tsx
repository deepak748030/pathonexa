import { createFileRoute, Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Truck } from "lucide-react";
import { PhoneIcon, MessageCircleIcon, CreditCardIcon, PackageOpenIcon, ShieldCheckIcon } from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Delivery, Payment & Bulk Orders | FEED POINT" },
      { name: "description", content: "Common questions about FEED POINT sarson khali — delivery, minimum order, payment, storage and quality." },
      { property: "og:title", content: "FAQ — FEED POINT" },
      { property: "og:description", content: "Everything farmers ask us about mustard cake and cattle feed." },
    ],
  }),
  component: FAQ,
});

const groups = [
  {
    icon: Truck,
    title: "Delivery",
    items: [
      { q: "Delivery kitne din mein ho jaati hai?", a: "State ke andar 2–4 din. Har Tuesday peraayi hoti hai, uske baad batch dispatch shuru hoti hai. Distant districts ke liye 5–6 din lag sakte hain." },
      { q: "Kahan-kahan delivery karte ho?", a: "Abhi UP, Haryana, Punjab, Rajasthan aur MP ke jyaadatar districts cover hote hain. Aap PIN daaliye checkout par, exact ETA aur delivery charge dikh jayega." },
      { q: "Delivery free kab hoti hai?", a: "₹5,000+ ke order pe delivery bilkul free hai. Chhote order pe flat ₹149 charge lagta hai." },
      { q: "Delivery kis time aati hai?", a: "Din mein 9am–6pm ke beech. Delivery se pehle driver call karta hai." },
    ],
  },
  {
    icon: PackageOpenIcon,
    title: "Orders & Minimum",
    items: [
      { q: "Minimum order kya hai?", a: "Ek sack minimum — chahe 10kg ka ho ya 100kg ka. Ghar ke liye 10kg/20kg, chhoti dairy ke liye 25kg/50kg, aur gaushala ke liye 100kg sacks best hain." },
      { q: "Bulk / gaushala order?", a: "10+ sacks ke liye special rate hai — WhatsApp par +91 98765 43210 pe message kariye, ya /shop pe bulk category dekhiye. Pallet delivery available hai." },
      { q: "Kya main saara stock ek saath book kar sakta hoon (subscription)?", a: "Haan — mahine ki fixed quantity book karwa lijiye, har hafte fresh batch se dispatch hoga. Contact karke set up karwa lein." },
    ],
  },
  {
    icon: CreditCardIcon,
    title: "Payment",
    items: [
      { q: "Payment kaise hoti hai?", a: "UPI (GPay/PhonePe/Paytm), sabhi debit/credit cards, aur net-banking accept hai. Bulk gaushala orders ke liye bank transfer bhi le lete hain." },
      { q: "Cash on Delivery available hai?", a: "Haan, ₹10,000 tak ke order pe COD available hai — chhota sa ₹49 COD handling charge lagta hai." },
      { q: "GST bill milta hai?", a: "Bilkul — sabhi orders pe GST invoice email/WhatsApp par bhej dete hain. Dairy business ke liye ITC claim ho jaata hai." },
    ],
  },
  {
    icon: ShieldCheckIcon,
    title: "Quality & Storage",
    items: [
      { q: "Kya khali sach mein fresh hoti hai?", a: "Har Tuesday peraayi hoti hai. Godaam mein purana stock nahi rakhte — jo mila woh usi hafte ka. Sack pe pressing date printed hoti hai." },
      { q: "Khali ko kaise store karein?", a: "Sookhi, thandi jagah pe rakhein — direct sunlight se door. Jute sack mein rakhna sabse behtar hai. Fresh khali 45–60 din tak asaani se chalti hai." },
      { q: "Protein aur oil % kaise verify karein?", a: "Har batch lab-tested hoti hai — protein aur residual oil ki report request kar sakte hain. Har product page pe expected range likhi hai." },
      { q: "Agar khali kharaab nikli to?", a: "Sack khulne ke 48 ghante ke andar bataiye — full refund ya replacement, without argument. Yeh humari zimmedari hai." },
    ],
  },
];

function FAQ() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 sm:pt-6 sm:pb-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary animate-float-up">Puchhne wale sawaal</p>
        <h1 className="mt-2 sm:mt-3 font-display text-2xl sm:text-6xl animate-float-up" style={{ animationDelay: "80ms" }}>
          Farmer FAQs
        </h1>
        <p className="mt-2 sm:mt-4 text-xs sm:text-base text-muted-foreground animate-float-up" style={{ animationDelay: "160ms" }}>
          Delivery, payment, quality aur storage — sab kuch seedhi baat mein.
        </p>
      </div>

      <div className="mt-6 sm:mt-12 space-y-5 sm:space-y-10">
        {groups.map(({ icon: Icon, title, items }, gi) => (
          <div key={title} className="animate-float-up" style={{ animationDelay: `${gi * 80}ms` }}>
            <div className="group flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4 cursor-default">
              <div className="grid h-7 w-7 sm:h-10 sm:w-10 place-items-center rounded-lg sm:rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                {title === "Delivery" ? <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" /> : <AnimatedIcon icon={Icon} size={14} />}
              </div>
              <h2 className="font-display text-base sm:text-3xl">{title}</h2>
            </div>
            <Accordion type="single" collapsible className="rounded-lg sm:rounded-2xl border border-border/60 bg-card/40 backdrop-blur px-3 sm:px-6">
              {items.map((it, i) => (
                <AccordionItem key={i} value={`${gi}-${i}`} className="border-border/60 last:border-b-0">
                  <AccordionTrigger className="text-left text-sm sm:text-lg hover:text-primary hover:no-underline py-3 sm:py-4">
                    {it.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-[15px]">
                    {it.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      <div className="mt-8 sm:mt-16 rounded-lg sm:rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4 sm:p-10 text-center">
        <h2 className="font-display text-lg sm:text-3xl">Aur koi sawaal?</h2>
        <p className="mt-1 sm:mt-2 text-xs sm:text-base text-muted-foreground">Seedha mill se baat kariye — 9am se 7pm tak.</p>
        <div className="mt-3 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          <Button asChild size="sm" className="sm:h-11 sm:px-8 sm:text-base">
            <a href="tel:+919876543210"><AnimatedIcon icon={PhoneIcon} size={14} /> +91 98765 43210</a>
          </Button>
          <Button asChild size="sm" variant="outline" className="sm:h-11 sm:px-8 sm:text-base">
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">
              <AnimatedIcon icon={MessageCircleIcon} size={14} /> WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="ghost" className="sm:h-11 sm:px-8 sm:text-base">
            <Link to="/shop">Browse shop</Link>
          </Button>
        </div>
      </div>
    </div>

  );
}
