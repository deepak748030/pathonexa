# PathoNexa Server 🧪

Production-grade REST API for the **PathoNexa Lab Management app** — built with
**Node.js + Express + MongoDB (Mongoose)**.

> 🔐 **Persistent by default:** MongoDB is required for account data. The server
> fails closed when persistence is unavailable. A disposable, tenant-partitioned
> in-memory adapter exists only for automated tests or explicit local opt-in.

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
| 🔐 **OTP Auth** | Mobile + persisted, one-time OTP challenge (`POST /api/auth/login`, `/verify`) returning JWT |
| 🧾 **Patients API** | List, get-by-id, stats, create (auto PID generation, duplicate-mobile check) |
| 📋 **Reports API** | List (patient populated), get-by-id, create |
| 📊 **Dashboard API** | Headline stats + last-7-days chart data |
| 🧬 **Meta API** | Tests catalogue & referring doctors list |
| 🛡️ **Tenant-safe store** | Mandatory account ownership, persistent MongoDB, account-scoped IDs and backup proofs |
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
# → { "status": "ok", "db": "mongodb", "persistent": true, ... }
```

New accounts start without patients, reports, doctors, transactions, or
notifications. Only the account-owned clinical test catalogue is initialized.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | Port the API listens on |
| `MONGODB_URI` | `mongodb://localhost:27017/pathonexa` | Required persistent Mongo connection string |
| `JWT_SECRET` | — | Secret for signing JWT tokens (**32+ random characters in production**) |
| `NODE_ENV` | `development` | Runtime environment |
| `ALLOW_IN_MEMORY` | `false` | Explicit disposable local adapter; never enable in production |
| `DEFAULT_COMMISSION_PERCENT` | `10` | Doctor commission % applied when a doctor is added without one |
| `MAX_DISCOUNT_PERCENT` | `50` | Max discount allowed on a report (% of the gross bill) |
| `CURRENCY_SYMBOL` | `₹` | Currency symbol used on receipts / seeded settings |
| `TRIAL_DAYS` | `7` | Free-trial length in days |
| `MONTHLY_PLAN_PRICE` | `799` | Monthly subscription price |
| `MONTHLY_PLAN_DAYS` | `30` | Monthly plan validity in days |
| `YEARLY_PLAN_PRICE` | `7999` | Yearly subscription price |
| `YEARLY_PLAN_DAYS` | `365` | Yearly plan validity in days |
| `INTERNAL_OTP` | `123456` | Internal OTP used by the expiring, attempt-limited challenge flow |

> Authenticated clients can read the business values (minus the OTP) at
> `GET /api/config`; change the `.env` and restart the server to update them.
> In MongoDB mode, OTP challenge hashes, expiry, cooldown, and attempt counts
> are persisted and atomically consumed, so verification remains safe across
> concurrent requests and multiple API instances.

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
| `POST` | `/auth/login` | `{ mobile }` | Starts an expiring OTP challenge (OTP is never returned) |
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
| `POST` | `/reports` | `{ patient, test, doctor?, date?, time?, amount, paid?, status? }` | Create report (account-scoped ID generated automatically) |

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
│   ├── config/db.js          # Required MongoDB connection + index synchronization
│   ├── lib/
│   │   ├── store.js          # Tenant-isolated persistent data store
│   │   └── seedData.js       # Account-owned test catalogue definitions
│   ├── models/               # Mongoose schemas (User, OTP challenge, tenant data)
│   └── routes/               # authRoutes, patientRoutes, reportRoutes,
│                             # dashboardRoutes, moduleRoutes, metaRoutes
├── .env.example              # Environment template
├── vercel.json               # Vercel deployment config
└── package.json
```

---

## 🔌 Connecting the App to This Server

The app reads `EXPO_PUBLIC_API_URL` (see `newapp/README.md`):

| App runs on | API base URL to use |
| --- | --- |
| Web / iOS simulator | `http://localhost:5000/api` |
| Android emulator | `http://10.0.2.2:5000/api` |
| Physical phone (Expo Go) | `http://<your-PC-LAN-IP>:5000/api` (auto-detected) |

The server listens on `0.0.0.0`. Configure `CORS_ORIGINS` for browser deployments;
native app requests do not send a browser Origin header.

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
| `MongoDB connection failed` in logs | The server fails closed. Check `MONGODB_URI`, database availability, and the Atlas IP allowlist. |
| App can't reach the server | Ensure the server is running (`npm run dev`) and the app's `EXPO_PUBLIC_API_URL` matches your platform (table above). |
| `EADDRINUSE` on port 5000 | Change `PORT` in `.env` and update `EXPO_PUBLIC_API_URL` in the app. |
| CORS errors | Add the exact browser origin to `CORS_ORIGINS`; native requests do not require a browser origin. |
