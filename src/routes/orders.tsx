import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useOrders, type OrderStatus } from "@/lib/orders-context";
import { useAuth } from "@/lib/auth-context";
import { Package, CheckCircle2, XCircle, Clock, Truck, Tag, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — FEED POINT" },
      { name: "description", content: "Your complete order history and transactions." },
    ],
  }),
  component: OrdersPage,
});

const STATUS_META: Record<OrderStatus, { label: string; icon: typeof Clock; className: string }> = {
  placed: { label: "Placed", icon: Clock, className: "text-amber-500 border-amber-500/40 bg-amber-500/10" },
  processing: { label: "Processing", icon: Truck, className: "text-sky-500 border-sky-500/40 bg-sky-500/10" },
  delivered: { label: "Delivered", icon: CheckCircle2, className: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "text-destructive border-destructive/40 bg-destructive/10" },
};

type Filter = "all" | OrderStatus;

function OrdersPage() {
  const { user } = useAuth();
  const { orders, cancelOrder } = useOrders();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const stats = {
    total: orders.length,
    active: orders.filter((o) => o.status === "placed" || o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    spent: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0),
  };

  const handleCancel = (id: string) => {
    cancelOrder(id);
    toast.success("Order cancelled");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
        <h1 className="mt-4 font-display text-4xl">Sign in to view orders</h1>
        <p className="mt-2 text-muted-foreground">Track your sacks and past transactions.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/auth" search={{ redirect: "/orders" }}>Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:pt-6 sm:pb-24">
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary">Account</p>
      <h1 className="mt-1 sm:mt-2 font-display text-2xl sm:text-6xl">My Orders</h1>
      <p className="mt-1 sm:mt-3 text-xs sm:text-base text-muted-foreground">Every sack, every transaction — all in one place.</p>

      {/* Stats */}
      <div className="mt-4 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="Total orders" value={stats.total.toString()} />
        <StatCard label="Active" value={stats.active.toString()} />
        <StatCard label="Delivered" value={stats.delivered.toString()} />
        <StatCard label="Spent" value={`₹${stats.spent.toLocaleString("en-IN")}`} />
      </div>


      {orders.length === 0 ? (
        <div className="mt-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <p className="mt-4 text-muted-foreground">You haven't placed any orders yet.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mt-4 sm:mt-10 flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {(["all", "placed", "processing", "delivered", "cancelled"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 whitespace-nowrap text-[10px] sm:text-[11px] uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border transition ${
                  filter === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {f === "all" ? `All (${orders.length})` : STATUS_META[f].label}
              </button>
            ))}
          </div>



          <ul className="mt-4 sm:mt-6 space-y-3 sm:space-y-5">
            {filtered.map((order) => {
              const meta = STATUS_META[order.status];
              const Icon = meta.icon;
              const canCancel = order.status === "placed" || order.status === "processing";
              return (
                <li
                  key={order.id}
                  className="rounded-lg sm:rounded-2xl border border-border/60 bg-card/50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:px-5 sm:py-4 border-b border-border/60 bg-background/40">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span
                        className={`inline-flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] uppercase tracking-widest px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border ${meta.className}`}
                      >
                        <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {meta.label}
                      </span>
                      <span className="font-mono text-[10px] sm:text-xs text-muted-foreground">{order.id}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Items */}
                  <ul className="divide-y divide-border/50">
                    {order.items.map(({ product, qty }) => (
                      <li key={product.id} className="grid grid-cols-[48px_1fr_auto] sm:grid-cols-[64px_1fr_auto] gap-3 sm:gap-4 items-center px-3 py-2 sm:px-5 sm:py-3">
                        <img src={product.image} alt={product.name} className="h-12 w-11 sm:h-16 sm:w-14 object-cover rounded-md" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Qty {qty} · ₹{product.price.toLocaleString("en-IN")}</p>
                        </div>
                        <span className="tabular-nums text-xs sm:text-sm">₹{(product.price * qty).toLocaleString("en-IN")}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Summary */}
                  <div className="px-3 py-3 sm:px-5 sm:py-4 border-t border-border/60 bg-background/40 grid gap-2 sm:gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-xs">
                      <div className="flex justify-between sm:justify-start sm:gap-6">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">₹{order.subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between sm:justify-start sm:gap-6 text-primary">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {order.promoCode ?? "Discount"}
                          </span>
                          <span className="tabular-nums">−₹{order.discount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between sm:justify-start sm:gap-6">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="tabular-nums">{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-right">
                        <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">Total</p>
                        <p className="font-display text-lg sm:text-2xl tabular-nums">₹{order.total.toLocaleString("en-IN")}</p>
                      </div>
                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(order.id)}
                          className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm text-destructive hover:text-destructive"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {order.status === "cancelled" && order.cancelledAt && (
                    <div className="px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-destructive/80 border-t border-destructive/20 bg-destructive/5">
                      Cancelled on {new Date(order.cancelledAt).toLocaleString("en-IN")}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>


          {filtered.length === 0 && (
            <div className="mt-10 text-center text-muted-foreground text-sm">
              No {filter} orders.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg sm:rounded-xl border border-border/60 bg-card/40 px-2.5 py-2 sm:px-4 sm:py-3">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 sm:mt-1 font-display text-lg sm:text-2xl tabular-nums">{value}</p>
    </div>
  );
}

