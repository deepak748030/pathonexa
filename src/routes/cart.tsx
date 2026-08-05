import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

export const Route = createFileRoute("/cart")({
  validateSearch: (search: Record<string, unknown>) => ({
    checkout: search.checkout === "1" || search.checkout === true ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Order — FEED POINT" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartRedirect,
});

function CartRedirect() {
  const navigate = useNavigate();
  const { openDrawer } = useCart();

  useEffect(() => {
    navigate({ to: "/", replace: true });
    openDrawer(true);
  }, [navigate, openDrawer]);

  return null;
}
