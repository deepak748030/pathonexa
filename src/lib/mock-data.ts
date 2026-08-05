import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";
import c1 from "@/assets/c1.jpg";
import c2 from "@/assets/c2.jpg";
import c3 from "@/assets/c3.jpg";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  category: string;
  tagline: string;
  description: string;
  details: string[];
};


// Prices in INR (₹). All products are mustard oil cake (sarson khali) — the
// nutrient-rich residue left after pressing mustard seeds for oil — and
// related cattle-feed blends for buffaloes and cows.
export const products: Product[] = [
  {
    id: "1",
    slug: "premium-sarson-khali-50kg",
    name: "Premium Sarson Khali — 50kg",
    price: 1850,
    mrp: 2180,
    image: p1,
    category: "Sarson Khali",
    tagline: "Fresh-pressed mustard cake, 32% protein.",
    description:
      "Solid, oil-rich mustard cake pressed from hand-cleaned yellow sarson seeds. High in protein and natural oil, it lifts milk yield in buffaloes and keeps cows in strong condition through the season.",
    details: ["32% crude protein", "8–10% residual mustard oil", "Fresh-pressed weekly", "50kg jute sack, stitched shut"],
  },
  {
    id: "2",
    slug: "cold-pressed-mustard-cake-25kg",
    name: "Cold-Pressed Mustard Cake — 25kg",
    price: 950,
    mrp: 1120,
    image: p2,
    category: "Cold-Pressed",
    tagline: "Slow cold-pressed, richer in oil.",
    description:
      "Cold-pressed at low temperature so more of the natural mustard oil stays in the cake. Preferred by dairy farmers who want visibly glossier coats and denser milk from their buffaloes and cows.",
    details: ["Cold-pressed, no heat treatment", "12% residual oil", "30% protein", "25kg convenience sack"],
  },
  {
    id: "3",
    slug: "golden-kolhu-khali-10kg",
    name: "Golden Kolhu Khali — 10kg",
    price: 420,
    mrp: 500,
    image: p3,
    category: "Kolhu",
    tagline: "Traditional wooden ghani.",
    description:
      "Milled the old way, on a slow-turning wooden kolhu. The cake comes out warm, fragrant and easy to break by hand — ideal for smaller herds and single-cow households.",
    details: ["Wooden kolhu pressed", "Small-batch, weekly grind", "Hand-broken chunks", "10kg re-sealable sack"],
  },
  {
    id: "4",
    slug: "buffalo-booster-blend-50kg",
    name: "Buffalo Booster Blend — 50kg",
    price: 2100,
    mrp: 2480,
    image: p4,
    category: "Buffalo Feed",
    tagline: "Mustard khali + minerals for milking buffaloes.",
    description:
      "A working-farm blend of sarson khali, crushed grain and a mineral premix formulated for milking buffaloes. Steady energy, calcium and phosphorus balanced for peak lactation.",
    details: ["Mustard khali base", "Added calcium, phosphorus, salt", "Formulated for milking buffaloes", "50kg branded sack"],
  },
  {
    id: "5",
    slug: "dairy-cow-feed-mix-40kg",
    name: "Dairy Cow Feed Mix — 40kg",
    price: 1650,
    mrp: 1950,
    image: p5,
    category: "Cow Feed",
    tagline: "Balanced ration for dairy cows.",
    description:
      "A gentler mix built for HF, Jersey and desi cows. Sarson khali paired with soaked grain, wheat bran and a light mineral dust so the ration stays palatable through summer heat.",
    details: ["Balanced for dairy cows", "Sarson khali + bran + grain", "Easy on the rumen", "40kg woven sack"],
  },
  {
    id: "6",
    slug: "high-protein-sarson-khali-30kg",
    name: "High-Protein Sarson Khali — 30kg",
    price: 1250,
    mrp: 1480,
    image: p6,
    category: "Sarson Khali",
    tagline: "Extra-lean, extra-protein pressing.",
    description:
      "Pressed harder to draw out more oil, leaving a lean, protein-dense cake. Use as a top-up on top of green fodder to push growth in young stock or peak lactation in adults.",
    details: ["36% crude protein", "Low residual oil", "Ideal as a protein top-up", "30kg jute sack"],
  },
  {
    id: "7",
    slug: "traditional-ghani-khali-20kg",
    name: "Traditional Ghani Khali — 20kg",
    price: 820,
    mrp: 970,
    image: p7,
    category: "Kolhu",
    tagline: "Round ghani disc, hand-cut.",
    description:
      "A dense, disc-shaped khali cut fresh from the ghani press. Farmers soak a piece overnight and mix into the morning feed — the traditional way to keep buffaloes strong through winter.",
    details: ["Hand-cut disc form", "Soak-and-feed friendly", "Fragrant, oil-rich", "20kg jute sack"],
  },
  {
    id: "8",
    slug: "bulk-cattle-feed-100kg",
    name: "Bulk Cattle Feed — 100kg",
    price: 3400,
    mrp: 4010,
    image: p8,
    category: "Bulk",
    tagline: "Farm-size sack, best per-kg price.",
    description:
      "A full 100kg sack of mustard khali and blended cattle feed for larger dairies and gaushalas. Delivered on pallets, sealed at the mill, priced for herds of ten and up.",
    details: ["100kg farm sack", "Best per-kg price", "Sealed at the mill", "Pallet delivery available"],
  },
];

export const collections = [
  { title: "Sarson Khali", copy: "Fresh-pressed mustard cake, straight from the mill.", image: c1, slug: "sarson-khali" },
  { title: "For Buffaloes & Cows", copy: "Ready-mixed rations for milking herds.", image: c2, slug: "cattle-feed" },
  { title: "Bulk & Gaushala", copy: "Farm-size sacks, delivered by the pallet.", image: c3, slug: "bulk" },
];
