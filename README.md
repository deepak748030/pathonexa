# PathoNexa 🧪

**Lab Management App + REST API** — run a diagnostics lab from your phone or
browser: patient records, report creation, dashboard analytics and printable
reports, all backed by a Node.js/Express/MongoDB server.

| Package | Stack | Docs |
| --- | --- | --- |
| `app/` | Expo (React Native) + Expo Router + TypeScript | [app/README.md](app/README.md) |
| `server/` | Node.js + Express + MongoDB (Mongoose) | [server/README.md](server/README.md) |

---

## 🚀 Quick Start (Local PC)

```bash
# 1) Backend  → http://localhost:5000
cd server
npm install
npm run dev          # works even without MongoDB (in-memory fallback + demo data)

# 2) App (new terminal)  → http://localhost:8080
cd app
npm install --legacy-peer-deps
EXPO_NO_TELEMETRY=1 npx expo start --web --port 8080
```

**Login:** any 10-digit mobile number → OTP **`123456`**.

The app auto-detects the backend host per platform (localhost / 10.0.2.2 /
LAN IP). Full instructions in each package's README.

---

## 🗂️ Repository Structure

```
pathonexa/
├── app/          # Expo app (screens, components, theme, API client)
│   └── README.md
├── server/       # Express API (models, routes, unified store, seeding)
│   └── README.md
├── package.json  # Root scripts (dev, web, typecheck)
└── .gitignore
```

## 🔗 App ↔ Server Connection

- `app/lib/api.ts` resolves the API base URL: `EXPO_PUBLIC_API_URL` →
  Metro host → platform defaults, adds the JWT header and a 12s timeout.
- `app/lib/serverStatus.ts` pings `GET /api/health`; the app shows a
  **server status card** (More tab) and an **offline banner** when the
  backend is unreachable.
- The server runs on `0.0.0.0` with CORS enabled and seeds demo
  patients/reports on first start (`SEED_DEMO=true`).

## 🛠️ Root Scripts

```bash
npm run dev          # web app on :8080
npm run dev:server   # nodemon on :5000
npm run typecheck    # app TypeScript check
```
