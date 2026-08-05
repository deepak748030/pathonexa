import * as React from "react";
import type { Product } from "./mock-data";

export type OrderItem = { product: Product; qty: number };
export type OrderStatus = "placed" | "processing" | "delivered" | "cancelled";

export type Order = {
  id: string;
  createdAt: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode: string | null;
  status: OrderStatus;
  cancelledAt?: number;
};

const KEY = "castlefeed_orders_v1";

type Ctx = {
  orders: Order[];
  placeOrder: (o: Omit<Order, "id" | "createdAt" | "status">) => Order;
  cancelOrder: (id: string) => void;
  clearAll: () => void;
};

const OrdersCtx = React.createContext<Ctx | null>(null);

function readStore(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = React.useState<Order[]>([]);

  React.useEffect(() => {
    setOrders(readStore());
  }, []);

  const persist = (next: Order[]) => {
    setOrders(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const placeOrder: Ctx["placeOrder"] = (o) => {
    const order: Order = {
      ...o,
      id: `CF-${Date.now().toString(36).toUpperCase()}`,
      createdAt: Date.now(),
      status: "placed",
    };
    persist([order, ...orders]);
    return order;
  };

  const cancelOrder = (id: string) => {
    persist(
      orders.map((o) =>
        o.id === id && o.status !== "cancelled"
          ? { ...o, status: "cancelled", cancelledAt: Date.now() }
          : o,
      ),
    );
  };

  const clearAll = () => persist([]);

  return (
    <OrdersCtx.Provider value={{ orders, placeOrder, cancelOrder, clearAll }}>
      {children}
    </OrdersCtx.Provider>
  );
}

export function useOrders() {
  const ctx = React.useContext(OrdersCtx);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
