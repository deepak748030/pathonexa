import * as React from "react";
import type { Product } from "./mock-data";

type CartItem = { product: Product; qty: number };
type State = { items: CartItem[]; open: boolean; hasAutoOpened: boolean; promo: string | null };
type Action =
  | { type: "add"; product: Product; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "openDrawer"; open: boolean }
  | { type: "setPromo"; code: string | null }
  | { type: "clear" };

const initial: State = { items: [], open: false, hasAutoOpened: false, promo: null };

// Mock promo codes
export type Promo = {
  code: string;
  label: string;
  kind: "percent" | "flat" | "freeship";
  value: number; // percent (0-100) or flat amount
  minSubtotal?: number;
};

export const PROMOS: Promo[] = [
  { code: "WELCOME15", label: "15% off for new farmers", kind: "percent", value: 15 },
  { code: "SAVE10", label: "10% off your order", kind: "percent", value: 10 },
  { code: "MEGA25", label: "25% off on orders above ₹3000", kind: "percent", value: 25, minSubtotal: 3000 },
  { code: "HARVEST20", label: "20% off the harvest sale", kind: "percent", value: 20, minSubtotal: 2000 },
  { code: "FLAT200", label: "₹200 off", kind: "flat", value: 200, minSubtotal: 1500 },
  { code: "FLAT500", label: "₹500 off big orders", kind: "flat", value: 500, minSubtotal: 4000 },
  { code: "BULK1000", label: "₹1000 off bulk stock-up", kind: "flat", value: 1000, minSubtotal: 7500 },
  { code: "FREESHIP", label: "Free delivery", kind: "freeship", value: 0 },
  { code: "SHIPFREE99", label: "Free delivery above ₹999", kind: "freeship", value: 0, minSubtotal: 999 },
];

export function findPromo(code: string | null | undefined): Promo | null {
  if (!code) return null;
  return PROMOS.find((p) => p.code === code.toUpperCase()) ?? null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const existing = state.items.find((i) => i.product.id === action.product.id);
      const items = existing
        ? state.items.map((i) => (i.product.id === action.product.id ? { ...i, qty: i.qty + qty } : i))
        : [...state.items, { product: action.product, qty }];
      const shouldAutoOpen = !state.hasAutoOpened;
      return {
        ...state,
        items,
        open: shouldAutoOpen ? true : state.open,
        hasAutoOpened: state.hasAutoOpened || shouldAutoOpen,
      };
    }
    case "remove":
      return { ...state, items: state.items.filter((i) => i.product.id !== action.id) };
    case "setQty":
      return {
        ...state,
        items: state.items
          .map((i) => (i.product.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i)),
      };
    case "openDrawer":
      return { ...state, open: action.open, hasAutoOpened: true };
    case "setPromo":
      return { ...state, promo: action.code };
    case "clear":
      return { ...state, items: [], promo: null };
  }
}


type Ctx = State & {
  add: (p: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  openDrawer: (open: boolean) => void;
  applyPromo: (code: string) => Promo | null;
  clearPromo: () => void;
  clear: () => void;
  count: number;
  subtotal: number;
  promoObj: Promo | null;
  discount: number;
  freeShip: boolean;
};

const CartCtx = React.createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initial);
  const count = state.items.length;
  const subtotal = state.items.reduce((s, i) => s + i.qty * i.product.price, 0);

  const promoObj = findPromo(state.promo);
  let discount = 0;
  let freeShip = false;
  if (promoObj && (!promoObj.minSubtotal || subtotal >= promoObj.minSubtotal)) {
    if (promoObj.kind === "percent") discount = Math.round((subtotal * promoObj.value) / 100);
    else if (promoObj.kind === "flat") discount = Math.min(promoObj.value, subtotal);
    else if (promoObj.kind === "freeship") freeShip = true;
  }

  const value: Ctx = {
    ...state,
    count,
    subtotal,
    promoObj,
    discount,
    freeShip,
    add: (p, qty) => dispatch({ type: "add", product: p, qty }),
    remove: (id) => dispatch({ type: "remove", id }),
    setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
    openDrawer: (open) => dispatch({ type: "openDrawer", open }),
    applyPromo: (code) => {
      const p = findPromo(code);
      if (!p) return null;
      if (p.minSubtotal && subtotal < p.minSubtotal) return null;
      dispatch({ type: "setPromo", code: p.code });
      return p;
    },
    clearPromo: () => dispatch({ type: "setPromo", code: null }),
    clear: () => dispatch({ type: "clear" }),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

