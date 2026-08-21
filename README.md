# PathoNexa 🧪

**Lab Management App + REST API** — run a diagnostics lab from your phone or
browser: patients, doctors & commission ledger, test master with parameter
definitions, packages, report creation with auto High/Low detection,
professional PDF reports (QR + barcode + PAID stamp), payments ledger with
receipts, expenses, business analytics, notifications, staff roles,
subscription and cloud backup — all backed by a Node.js/Express/MongoDB
server.

Everything specified in `Pathonexa structure .pdf` and drawn in
`pathonexa App UI Demo-compressed.pdf` is implemented — see
[docs/FEATURE-AUDIT.md](docs/FEATURE-AUDIT.md) for the point-by-point map.

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

## 🧩 Modules

| Area | What you get |
| --- | --- |
| Patients | Auto PID, barcode + QR card, full demographics, history, import / export CSV, groups, duplicate finder |
| Doctors | Clinic, specialization, WhatsApp, UPI / bank, commission %, ledger with monthly statement + PDF |
| Test master | Unlimited tests; each parameter has unit, normal range, critical high/low, male/female/child ranges, decimals, print order, bold, highlight |
| Packages | Bundled tests at a package price |
| Reports | 3-step creation, drafts, technician, discount / paid / pending, payment mode, auto H/L + critical flags, owner verification, duplicate, delete + restore |
| PDF | Lab header, patient block, grouped tables, QR, barcode, signature, stamp, PAID/UNPAID, generated date |
| Payments | Ledger of every rupee, collect pending, printable receipts, mode split |
| Commission | Doctor wallets, payouts, history |
| Expenses | 10 categories, category chart, monthly report |
| Analytics | Daily · weekly · monthly · yearly revenue, profit, doctor-wise, test-wise, most performed, CSV export |
| Notifications | Report ready, payment pending, commission due, subscription expiry |
| Staff | Super Admin / Owner / Manager / Receptionist / Technician + permission matrix |
| Subscription | 7-day trial, monthly, yearly, expiry reminder, invoices |
| Backup | Automatic + manual snapshot, JSON export, restore |
| Settings | Logo, signature, stamp, GST, footer, WhatsApp template, theme, language |

## 🗂️ Repository Structure

```
pathonexa/
├── app/          # Expo app (screens, components, theme, API client)
│   └── README.md
├── newapp/       # Fresh Expo app — UI rebuilt from scratch exactly per
│                 # "pathonexa App UI Demo-compressed.pdf" (same dependency
│                 # versions as app/). Original app/ is untouched.
├── server/       # Express API (models, routes, unified store, seeding)
│   └── README.md
├── package.json  # Root scripts (dev, web, typecheck)
└── .gitignore
```

### 🆕 newapp (UI-PDF build)

```bash
cd newapp
npm install --legacy-peer-deps
EXPO_NO_TELEMETRY=1 EXPO_NO_DEPENDENCY_VALIDATION=1 EXPO_OFFLINE=1 npx expo start --web --port 8081 --lan
```

Screens implemented 1:1 from the UI PDF: Dashboard (stat cards, quick
actions, reports-overview line chart, recent reports, today's-reports
donut), Patients (+stats/search/list/import-export row), Add New Patient
form, Reports (date chips, status tabs, pagination), 3-step Create Report
wizard (patient/doctor/test selection, amount + payment mode, grouped
parameter value entry with H/L flags, preview & save) and the dark PDF
Report Preview viewer (letterhead, QR, grouped result tables, signature /
stamp footer, Share / Download / Print bar), More tab and the side drawer.

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
