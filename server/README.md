# PathoNexa Server 🧪

Production-grade REST API for the **PathoNexa Lab Management app** — built with
**Node.js + Express + MongoDB (Mongoose)**.

> 💡 **Zero-setup local demo:** if MongoDB is not available, the server
> automatically falls back to a built-in **in-memory store** (seeded with demo
> data) so the API always responds. Perfect for running the app locally and
> checking the full flow without installing a database.

---

## 🧩 Modules

Patients · Doctors + ledger · Test master (with full parameter definitions) ·
Packages · Reports (create, duplicate, verify, delete, restore) · Payments
ledger & receipts · Doctor commission wallet · Expenses · Analytics ·
Notifications · Subscription · Settings · Backup / restore · Roles &
permissions — i.e. every collection listed in the specification
(Users, Patients, Doctors, Tests, TestTemplates, Packages, Reports,
ReportValues, Payments, DoctorLedger, Expenses, Staff, Settings,
Notifications, Subscriptions).

## ✨ Features

| Feature | Description |
| --- | --- |
| 🔐 **OTP Auth** | Mobile + OTP login (`POST /api/auth/login`, `/verify`) returning JWT |
| 🧾 **Patients API** | List, get-by-id, stats, create (auto PID generation, duplicate-mobile check) |
| 📋 **Reports API** | List (patient populated), get-by-id, create |
| 📊 **Dashboard API** | Headline stats + last-7-days chart data |
| 🧬 **Meta API** | Tests catalogue & referring doctors list |
| 🛡️ **Resilient store** | MongoDB ↔ in-memory fallback, auto demo-data seeding |
| 🌍 **Deploy-ready** | Works locally and on Vercel (`vercel.json` included) |

---

## 🚀 Quick Start (Local PC)

```bash
cd server
npm install

# 1) Copy env (defaults are already fine for local dev)
cp .env.example .env      # skip if .env already exists

# 2) Run the API
npm run dev               # http://localhost:5000
```

Verify it's alive:

```bash
curl http://localhost:5000/api/health
# → { "status": "ok", "db": "memory", ... }   (or "db": "mongodb")
```

The server **seeds demo data automatically** on first start (patients, reports,
tests, doctors), so the app is never empty. Set `SEED_DEMO=false` to disable.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | Port the API listens on |
| `MONGODB_URI` | `mongodb://localhost:27017/pathonexa` | Mongo connection string. Empty ⇒ in-memory store |
| `JWT_SECRET` | — | Secret for signing JWT tokens (**change in production**) |
| `NODE_ENV` | `development` | `production` disables auto-listen (for Vercel) |
| `SEED_DEMO` | `true` | Seed demo data when the DB is empty |
| `DEFAULT_COMMISSION_PERCENT` | `10` | Doctor commission % applied when a doctor is added without one |
| `MAX_DISCOUNT_PERCENT` | `50` | Max discount allowed on a report (% of the gross bill) |
| `CURRENCY_SYMBOL` | `₹` | Currency symbol used on receipts / seeded settings |
| `TRIAL_DAYS` | `7` | Free-trial length in days |
| `MONTHLY_PLAN_PRICE` | `799` | Monthly subscription price |
| `MONTHLY_PLAN_DAYS` | `30` | Monthly plan validity in days |
| `YEARLY_PLAN_PRICE` | `7999` | Yearly subscription price |
| `YEARLY_PLAN_DAYS` | `365` | Yearly plan validity in days |
| `DEMO_OTP` | `123456` | OTP accepted at login until a real SMS gateway exists |

> The business values are exposed (minus the OTP) at `GET /api/config`, and the
> app reads them from there — change the `.env`, restart the server, done.

**MongoDB Atlas:** create a free cluster at [mongodb.com](https://www.mongodb.com/cloud/atlas),
whitelist your IP in *Network Access*, and paste the connection string into
`MONGODB_URI`.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Health
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Server + DB status (`db`: `mongodb` \| `memory`) |

### Auth
| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | `{ mobile }` | Sends OTP (demo OTP: **123456**) |
| `POST` | `/auth/verify` | `{ mobile, otp }` | Returns `{ token, user }` |

### Patients
| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/patients` | — | All patients, newest first |
| `GET` | `/patients/stats` | — | Totals, new this week, weekly collection |
| `GET` | `/patients/:id` | — | One patient (by `_id` or `pid`) |
| `POST` | `/patients` | `{ name, age, gender, mobile, blood?, address? }` | Create patient (auto PID) |

### Reports
| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/reports` | — | All reports (patient object embedded) |
| `GET` | `/reports/:id` | — | One report (by `_id` or `reportId`) |
| `POST` | `/reports` | `{ reportId, patient, test, doctor?, date?, time?, amount, paid?, status? }` | Create report |

### Dashboard
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/dashboard/stats` | Eight headline tiles (revenue, pending, commission, expense, monthly revenue, profit) |
| `GET` | `/dashboard/chart` | Last-7-days counts + totals |

### Master data (CRUD for every collection)

`tests · doctors · employees · centers · payments · discounts · templates ·
packages · expenses · transactions · commissions · drafts · labs · roles`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/:collection` | List records |
| `GET` | `/:collection/:id` | One record |
| `POST` | `/:collection` | Create |
| `PATCH` \| `PUT` | `/:collection/:id` | Update (e.g. a test's `parameters[]`) |
| `DELETE` | `/:collection/:id` | Soft delete → Deleted Records |
| `GET` | `/deleted` | Recycle bin |
| `POST` | `/deleted/:id/restore` | Restore a deleted record |

### Doctors & commission
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/doctors/summary` | Doctors + business, earned / paid / pending commission |
| `GET` | `/doctors/:id/ledger` | Full ledger: monthly statement, referred reports, payouts |
| `GET` | `/commissions/summary` | Wallet totals across all doctors |
| `GET` | `/commissions` | Payout history |
| `POST` | `/commissions/pay` | `{ doctorId, amount, mode, note }` → payout + ledger entry |

### Payments (ledger)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/transactions` | Every collection / payout / subscription entry |
| `GET` | `/transactions/summary` | Today, total, pending, split by mode |
| `POST` | `/transactions/collect` | `{ reportId, amount, mode, txnId }` → updates the report balance |

### Expenses & analytics
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/expenses/summary` | Today / month / total, by category, monthly report |
| `GET` | `/expense-categories` | The 10 spec categories |
| `GET` | `/analytics` | Daily·weekly·monthly·yearly revenue, profit, doctor-wise, test-wise, most performed |

### Settings, subscription, notifications, backup
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` \| `PATCH` | `/settings` (alias `/lab`) | Logo, GST, footer, signature, stamp, theme, language, workflow flags |
| `GET` | `/subscription` | Plan, expiry, days left, reminder flag, invoices |
| `POST` | `/subscription/subscribe` | `{ planId: trial \| monthly \| yearly }` |
| `GET` | `/notifications` | Report ready · payment pending · commission due · subscription expiry |
| `GET` | `/notifications/count` | Unread badge count |
| `POST` | `/notifications/:id/read`, `/notifications/read-all` | Mark read |
| `GET` | `/backup/status` \| `/backup/export` | Storage info / full JSON snapshot |
| `POST` | `/backup/run` \| `/backup/restore` | Manual backup / restore from JSON |
| `GET` | `/roles-matrix` | Roles + permission matrix |

---

## 📁 Folder Structure

```
server/
├── src/
│   ├── index.js              # Express app entry (routes, middleware, error handling)
│   ├── config/db.js          # MongoDB connection (never crashes — memory fallback)
│   ├── lib/
│   │   ├── store.js          # Unified data store (MongoDB ↔ in-memory)
│   │   └── seedData.js       # Demo seed data
│   ├── models/               # Mongoose schemas (User, Patient, Report, Meta)
│   └── routes/               # authRoutes, patientRoutes, reportRoutes,
│                             # dashboardRoutes, moduleRoutes, metaRoutes
├── .env.example              # Environment template
├── vercel.json               # Vercel deployment config
└── package.json
```

---

## 🔌 Connecting the App to This Server

The app reads `EXPO_PUBLIC_API_URL` (see `app/README.md`):

| App runs on | API base URL to use |
| --- | --- |
| Web / iOS simulator | `http://localhost:5000/api` |
| Android emulator | `http://10.0.2.2:5000/api` |
| Physical phone (Expo Go) | `http://<your-PC-LAN-IP>:5000/api` (auto-detected) |

The server listens on `0.0.0.0` and has CORS fully enabled, so all of the
above work out of the box.

---

## ☁️ Deploy to Vercel

```bash
npm i -g vercel
vercel                      # inside the server/ folder
```

- Add `MONGODB_URI` + `JWT_SECRET` in the Vercel dashboard (*Settings → Environment Variables*).
- Then point `EXPO_PUBLIC_API_URL` in the app to `https://your-app.vercel.app/api`.

---

## 🛠️ Troubleshooting

| Problem | Fix |
| --- | --- |
| `MongoDB connection failed` in logs | Server runs on the in-memory store — fine for demo. Check your `MONGODB_URI` / Atlas IP whitelist for persistence. |
| App can't reach the server | Ensure the server is running (`npm run dev`) and the app's `EXPO_PUBLIC_API_URL` matches your platform (table above). |
| `EADDRINUSE` on port 5000 | Change `PORT` in `.env` and update `EXPO_PUBLIC_API_URL` in the app. |
| CORS errors | Not expected — `cors()` is enabled for all origins. |
