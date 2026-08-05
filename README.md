<div align="center">

# FEED POINT

**Fresh-pressed sarson khali & cattle feed — milled weekly, delivered to your farm gate.**

A production-grade storefront for a three-generation family mustard mill, built for Indian dairy farmers ordering sarson khali (mustard oil cake) and balanced feed blends for buffaloes and cows.

[Live preview](https://feedpoint.vercel.app/) · [Report an issue](#support)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Routing](#routing)
- [Data](#data)
- [Design System](#design-system)
- [Deployment](#deployment)
- [SEO & Metadata](#seo--metadata)
- [Contributing](#contributing)
- [Support](#support)

---

## Overview

FEED POINT is a mobile-first e-commerce site for a family-run mustard oil mill serving 2,100+ dairy farms across India. Farmers can browse fresh-pressed sarson khali and cattle feed blends, save items to a wishlist, apply coupons, and place orders — all in a single-language (Hinglish) interface designed for low-end Android devices and patchy rural networks.

The app is a **React 19 + Vite 7** single-page application using file-based routing via TanStack Router.

---

## Features

### Storefront
- **Landing page** with hero typewriter animation, featured collections, bestsellers grid, farmer reviews, and monthly mill-note newsletter
- **Shop** with category filters (Sarson Khali, Cold-Pressed, Kolhu, Buffalo Feed, Cow Feed, Bulk)
- **Product detail** page with tagline, description, spec details, and add-to-cart
- **Search** with debounced query params (`?q=`) and instant filtering across name, category, tagline and description

### Cart & Checkout
- Persistent **cart** with quantity controls, running subtotal, and mini cart drawer
- **Coupon system** (`/promos`) with percent-off, flat-off, and free-delivery kinds; eligibility gated by minimum order
- **Two-step checkout** — delivery address → payment
- **Order history** stored per user for reordering

### Account
- **Phone-OTP authentication** flow (Indian mobile numbers)
- **Wishlist** ("Saved Sacks") synced to local storage
- **Addresses** with default selection and CRUD
- **My Orders** with status timeline

### Content
- **About** — three-generation story of the ghani, founder photo, mill imagery
- **How We Mill It** — sourcing → cleaning → cold pressing → cooling → packing walkthrough
- **FAQ** — delivery, payment, minimum order, storage, and quality
- **Reviews** — farmer testimonials with photos and star ratings

### UX polish
- Fully **responsive** (design starts at 390 px mobile, scales to 1440+ desktop)
- Custom animated icon set via [`@animateicons/react`](https://www.npmjs.com/package/@animateicons/react) with a hover-bridging wrapper so parent hovers trigger icon animation
- Skeleton spinners, hover elevation, gradient overlays, and float-up entrance animations
- Toast notifications via **Sonner**

---

## Tech Stack

| Layer          | Choice                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Framework      | React 19                                                               |
| Build tool     | [Vite 7](https://vitejs.dev)                                           |
| Router         | [TanStack Router](https://tanstack.com/router) (file-based)            |
| Data           | [TanStack Query](https://tanstack.com/query)                           |
| Styling        | [Tailwind CSS v4](https://tailwindcss.com) (CSS-first `@theme`)        |
| UI primitives  | [Radix UI](https://www.radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) |
| Icons          | [`@animateicons/react`](https://npmjs.com/package/@animateicons/react) + [lucide-react](https://lucide.dev) |
| Forms          | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev)    |
| Animation      | [motion](https://motion.dev)                                           |
| Notifications  | [Sonner](https://sonner.emilkowal.ski)                                 |
| Language       | TypeScript (strict)                                                    |

---

## Project Structure

```text
src/
├── assets/                 Images, logos, hero art (imported as URLs)
├── components/
│   ├── site/               Domain UI: Navbar, Footer, ProductCard, CartDrawer, Reviews, TrustBadges
│   └── ui/                 shadcn/ui primitives + AnimatedIcon wrapper
├── hooks/                  Reusable hooks (use-mobile, ...)
├── lib/
│   ├── mock-data.ts        Products & collections seed
│   ├── cart-context.tsx    Cart + promo state (with PROMOS list)
│   ├── auth-context.tsx    Phone-OTP auth flow
│   ├── address-context.tsx Address book
│   ├── orders-context.tsx  Order history
│   └── wishlist-context.tsx
├── routes/                 File-based routes (see Routing)
│   ├── __root.tsx          Root layout, sitewide head/meta, providers
│   ├── index.tsx           Landing page
│   ├── shop.tsx
│   ├── product.$slug.tsx
│   ├── search.tsx
│   ├── cart.tsx
│   ├── checkout.address.tsx
│   ├── checkout.payment.tsx
│   ├── promos.tsx
│   ├── orders.tsx
│   ├── wishlist.tsx
│   ├── auth.tsx
│   ├── about.tsx
│   ├── how-we-mill-it.tsx
│   └── faq.tsx
├── router.tsx              Router config (QueryClient in context)
├── styles.css              Tailwind v4 @theme tokens
└── routeTree.gen.ts        AUTO-GENERATED — do not edit
```

---

## Getting Started

### Prerequisites
- **Bun** ≥ 1.1 (recommended) or Node.js ≥ 20

### Install & run

```bash
bun install
bun run dev
```

The dev server starts on <http://localhost:8080> with HMR.

### Production build

```bash
bun run build     # optimized production build
bun run preview   # preview the built bundle
```

---

## Environment Variables

Public (client-safe) values are prefixed `VITE_` and injected at build time from `.env`.

Add any third-party public keys (analytics, maps, etc.) as `VITE_*` variables in `.env`. Never commit private secrets to the repo.

---

## Available Scripts

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `bun run dev`       | Vite dev server with HMR (port 8080)           |
| `bun run build`     | Production build                               |
| `bun run build:dev` | Development-mode build (source maps, no minify) |
| `bun run preview`   | Serve the production build locally             |
| `bun run lint`      | ESLint over the entire project                 |
| `bun run format`    | Prettier format all files                      |

---

## Routing

Routes are **file-based** under `src/routes/` — the TanStack Router Vite plugin generates `routeTree.gen.ts` automatically. Do not edit that file.

| Path                    | File                          | Purpose                       |
| ----------------------- | ----------------------------- | ----------------------------- |
| `/`                     | `index.tsx`                   | Landing                       |
| `/shop`                 | `shop.tsx`                    | Product catalogue             |
| `/product/:slug`        | `product.$slug.tsx`           | Product detail                |
| `/search`               | `search.tsx`                  | Debounced search              |
| `/cart`                 | `cart.tsx`                    | Cart                          |
| `/checkout/address`     | `checkout.address.tsx`        | Delivery details              |
| `/checkout/payment`     | `checkout.payment.tsx`        | Payment                       |
| `/promos`               | `promos.tsx`                  | Available coupons             |
| `/orders`               | `orders.tsx`                  | My orders                     |
| `/wishlist`             | `wishlist.tsx`                | Saved sacks                   |
| `/auth`                 | `auth.tsx`                    | Phone-OTP sign-in             |
| `/about`                | `about.tsx`                   | Our story                     |
| `/how-we-mill-it`       | `how-we-mill-it.tsx`          | Process walkthrough           |
| `/faq`                  | `faq.tsx`                     | Frequently asked questions    |

Every route sets its own `head()` with unique `title`, `description`, `og:title`, and `og:description`.

---

## Data

- **Products & collections** are seeded from `src/lib/mock-data.ts`.
- **Cart, wishlist, addresses, orders, and auth** state live in React Context providers under `src/lib/*-context.tsx` and persist to `localStorage`.
- No backend, database, or server code — the app runs entirely client-side.

---

## Design System

Tokens live in `src/styles.css` under Tailwind v4's `@theme`. Palette is a warm mill-earth theme:

- **Primary** — mill green
- **Background** — cream / ivory
- **Foreground** — deep bark
- **Display font** — serif display for headings
- **Body font** — sans for paragraphs

Rules:
- Never hardcode colors (`text-white`, `bg-[#...]`) — use semantic tokens (`text-foreground`, `bg-primary`) so dark mode and theming stay consistent.
- All shadcn primitives are variants of tokens — extend variants rather than overriding classes at call sites.
- Icons: prefer `@animateicons/react` wrapped in `<AnimatedIcon>` for hover animation; fall back to `lucide-react` when no animated equivalent exists.

---

## Deployment

The project is deployed to **Vercel** at <https://feedpoint.vercel.app/>.

To deploy your own copy:

1. Push the repo to GitHub.
2. Import it into [Vercel](https://vercel.com) — it auto-detects the Vite setup.
3. Set any `VITE_*` env vars in **Project → Settings → Environment Variables**.
4. Every push to `main` triggers a production deploy; PRs get preview URLs.

---

## SEO & Metadata

- Every route defines a unique `title` (< 60 chars) and `description` (< 160 chars) via `head()`.
- `og:type` is `website` on `__root.tsx`; leaf routes override with `article`, `product`, etc.
- `canonical` and `og:url` are self-referential on every leaf.
- JSON-LD (`Organization` sitewide, `Product` on product routes, `FAQPage` on FAQ) is inlined via the `scripts` array.
- Images use lazy loading and explicit `width`/`height` to prevent CLS.

---

## Contributing

Issues and pull requests are welcome. Before opening a PR:

1. `bun run lint` — must pass with zero warnings.
2. `bun run format` — Prettier formatted.
3. Manual smoke test at 390 px (mobile), 768 px (tablet), and 1440 px (desktop).
4. New routes must set full head metadata (title, description, og:*, canonical).

---

## Support

- **Storefront questions:** call the mill at **+91 98765 43210**
- **Bug reports & feature requests:** open an issue in this repository
- **Bulk / distributor enquiries:** email `hello@feedpoint.in`

---

<div align="center">
Pressed weekly. Delivered to your gate.
</div>
