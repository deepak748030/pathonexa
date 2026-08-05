import { Link, useNavigate } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import {
  ShoppingCartIcon,
  MenuIcon,
  PhoneIcon,
  LogoutIcon,
  UserIcon,
  MapPinIcon,
  SearchIcon,
  BookmarkIcon,
} from "@animateicons/react/lucide";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "Our Story" },
  { to: "/how-we-mill-it", label: "How We Mill" },
  { to: "/faq", label: "FAQ" },
];

export function Navbar() {
  const { count, openDrawer } = useCart();
  const { count: savedCount } = useWishlist();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = (user?.display_name || user?.phone || "?")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const handleSignOut = () => {
    signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-1.5 px-2.5 py-2 sm:gap-4 sm:px-6 sm:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 group">
          <img src={logo} alt="FEED POINT" className="h-9 w-9 shrink-0 transition-transform group-hover:rotate-[8deg]" />
          <span className="font-display text-xl tracking-tight text-foreground truncate">
            Feed<span className="text-primary">Point</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-8">
          {nav.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              className="relative text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:bottom-[-6px] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1 justify-self-end">
          <Link
            to="/search"
            aria-label="Search"
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <AnimatedIcon icon={SearchIcon} size={18} />
          </Link>


          <Link
            to="/wishlist"
            aria-label="Saved"
            className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-foreground hover:bg-accent transition"
          >
            <AnimatedIcon icon={BookmarkIcon} size={18} />
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground animate-in zoom-in duration-200">
                {savedCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => openDrawer(true)}
            aria-label="Cart"
            className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-foreground hover:bg-accent transition"
          >
            <AnimatedIcon icon={ShoppingCartIcon} size={18} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground animate-in zoom-in duration-200">
                {count}
              </span>
            )}
          </button>


          {/* Desktop-only account control */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account"
                  className="ml-1 rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary transition bg-accent hover:bg-white/40"
                >
                  <Avatar className="h-9 w-9 border border-border/60">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.display_name} />}
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {initials || <UserIcon size={16} />}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium truncate">{user.display_name}</span>
                    <span className="text-xs text-muted-foreground truncate">+91 {user.phone}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/orders"><Receipt className="mr-2 h-4 w-4" /> My orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/checkout/address"><AnimatedIcon icon={MapPinIcon} size={16} className="mr-2" /> Delivery address</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist"><AnimatedIcon icon={BookmarkIcon} size={16} className="mr-2" /> Saved items</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openDrawer(true)}>
                    <AnimatedIcon icon={ShoppingCartIcon} size={16} className="mr-2" /> Cart
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <AnimatedIcon icon={LogoutIcon} size={16} className="mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/auth"
                aria-label="Sign in"
                className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground bg-accent hover:bg-white/40 transition"
              >
                <AnimatedIcon icon={UserIcon} size={18} />
              </Link>
            )}
          </div>

          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="md:hidden inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full hover:bg-accent transition ml-0.5"
          >
            <AnimatedIcon icon={MenuIcon} size={20} />
          </button>

        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[82%] max-w-sm border-border/60 bg-background p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <SheetTitle asChild>
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <img src={logo} alt="FEED POINT" className="h-8 w-8" />
                <span className="font-display text-xl">
                  Feed<span className="text-primary">Point</span>
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-5 py-2">
            {nav.map((n, i) => (
              <Link
                key={i}
                to={n.to}
                onClick={() => setOpen(false)}
                className="group py-3 text-[15px] font-medium tracking-tight text-foreground/90 border-b border-border/40 flex items-center justify-between hover:text-primary hover:pl-1 transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span>{n.label}</span>
                <span className="text-primary/60 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-base">→</span>
              </Link>
            ))}

            {user && (
              <>
                <Link
                  to="/orders"
                  onClick={() => setOpen(false)}
                  className="group py-3 text-[15px] font-medium tracking-tight text-foreground/90 border-b border-border/40 flex items-center justify-between hover:text-primary hover:pl-1 transition-all"
                >
                  <span>My orders</span>
                  <span className="text-primary/60 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-base">→</span>
                </Link>
                <Link
                  to="/checkout/address"
                  onClick={() => setOpen(false)}
                  className="group py-3 text-[15px] font-medium tracking-tight text-foreground/90 border-b border-border/40 flex items-center justify-between hover:text-primary hover:pl-1 transition-all"
                >
                  <span>Delivery address</span>
                  <span className="text-primary/60 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-base">→</span>
                </Link>
              </>
            )}

            <Link
              to="/wishlist"
              onClick={() => setOpen(false)}
              className="group py-3 text-[15px] font-medium tracking-tight text-foreground/90 border-b border-border/40 flex items-center justify-between hover:text-primary hover:pl-1 transition-all"
            >
              <span>Saved items{savedCount > 0 ? ` (${savedCount})` : ""}</span>
              <span className="text-primary/60 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-base">→</span>
            </Link>

            <Link
              to="/promos"
              onClick={() => setOpen(false)}
              className="group py-3 text-[15px] font-medium tracking-tight text-foreground/90 border-b border-border/40 flex items-center justify-between hover:text-primary hover:pl-1 transition-all"
            >
              <span>Offers</span>
              <span className="text-primary/60 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-base">→</span>
            </Link>

            <button
              onClick={() => {
                setOpen(false);
                openDrawer(true);
              }}
              className="group py-3 text-[15px] font-medium tracking-tight text-foreground/90 border-b border-border/40 flex items-center justify-between hover:text-primary hover:pl-1 transition-all w-full text-left"
            >
              <span>Cart{count > 0 ? ` (${count})` : ""}</span>
              <span className="text-primary/60 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-base">→</span>
            </button>

            <div className="pt-6 space-y-3">
              <a href="tel:+919876543210" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition">
                <AnimatedIcon icon={PhoneIcon} size={16} /> +91 98765 43210
              </a>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
                Milled weekly · delivered fresh
              </p>
            </div>
          </nav>

          {/* Profile section — pinned to bottom (mobile) */}
          <div className="px-6 py-4 border-t border-border/50 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-border/60">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.display_name} />}
                  <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                    {initials || <UserIcon size={16} />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">+91 {user.phone}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition"
                >
                  <AnimatedIcon icon={LogoutIcon} size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3 hover:border-primary/60 hover:bg-accent transition"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <AnimatedIcon icon={UserIcon} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Sign in</p>
                  <p className="text-xs text-muted-foreground">with your mobile number</p>
                </div>
                <span className="text-primary shrink-0">→</span>
              </Link>
            )}
          </div>

        </SheetContent>
      </Sheet>
    </header>
  );
}
