# PathoNexa — PDF ↔ Code Feature Audit

Source documents:

1. **`Pathonexa structure .pdf`** — the functional spec (15 pages, modules & DB collections).
2. **`pathonexa App UI Demo-compressed.pdf`** — the UI reference (9 screens).

Legend: ✅ shipped · 🆕 added in this pass · ⛔️ intentionally out of scope

## 1. Spec PDF — module by module

| Spec module | Status | Where |
| --- | --- | --- |
| User roles (Super Admin / Owner / Receptionist / Technician / Manager) | 🆕 | `app/lib/permissions.ts`, `app/app/manage/roles.tsx`, `GET /api/roles` |
| Complete workflow (search → patient → doctor → test → payment → sample → values → PDF → verify → print → WhatsApp → history) | 🆕 verification + receipt steps | `app/app/create-report.tsx`, `app/app/report-preview.tsx` |
| Dashboard (revenue, reports, pending, commission, monthly revenue, expense, profit) | 🆕 monthly revenue / profit tiles | `GET /api/dashboard/stats` |
| Patient module (all fields, barcode, QR, history, edit, delete) | 🆕 barcode + QR | `app/components/CodeStrip.tsx`, `app/app/patient/[id].tsx` |
| Doctor module (clinic, specialization, WhatsApp, bank, UPI, status, notes) | 🆕 | `app/app/manage/doctors.tsx` |
| Doctor ledger (total/paid/pending commission, monthly statement, PDF export) | 🆕 | `app/app/doctor/[id].tsx`, `GET /api/doctors/:id/ledger` |
| Test master (category, department, template, header, status + 13 parameter fields) | 🆕 | `app/app/test/[id].tsx`, `GET/PATCH /api/tests/:id` |
| Package module (bundled tests, package price) | 🆕 | `app/app/manage/packages.tsx` |
| Report creation (3 steps, auto price, discount, paid/pending, technician) | 🆕 technician + drafts | `app/app/create-report.tsx` |
| Auto High/Low detection | ✅ | `app/lib/testParams.ts` |
| Professional PDF (logo, patient block, table, QR, barcode, signature, paid stamp) | 🆕 QR/barcode/stamp/footer | `app/lib/reportHtml.ts` |
| Payment module (invoice, discount, paid, pending, mode, txn id, date, ledger) | 🆕 | `app/app/manage/transactions.tsx`, `/api/transactions` |
| Doctor commission module (wallet, pay, history, pending) | 🆕 | `app/app/manage/commissions.tsx`, `/api/commissions` |
| Expense module (10 categories, monthly expense report) | 🆕 | `app/app/manage/expenses.tsx`, `/api/expenses/summary` |
| Analytics (daily/weekly/monthly/yearly, profit, doctor-wise, test-wise, most performed) | 🆕 | `app/app/manage/analytics.tsx`, `/api/analytics` |
| Report history (search by name/mobile/PID/doctor/date/barcode/report no + 8 actions) | 🆕 duplicate/delete/share/WhatsApp | `app/app/(tabs)/reports.tsx` |
| WhatsApp module (one-click share with message template) | ✅ 🆕 template from settings | `app/lib/share.ts` |
| Notifications (report ready, payment pending, subscription expiry, commission due) | 🆕 | `/api/notifications`, `app/app/notifications.tsx` |
| Backup (automatic cloud, manual, restore) | 🆕 | `/api/backup`, `app/app/manage/backup.tsx` |
| Staff management (roles + permission based access) | 🆕 | `app/app/manage/roles.tsx` |
| Subscription (7-day trial, monthly, yearly, expiry reminder) | 🆕 | `/api/subscription`, `app/app/manage/subscription.tsx` |
| Settings (logo, name, address, contact, email, GST, footer, signature, stamp, theme, language) | 🆕 | `/api/settings`, `app/app/manage/settings.tsx` |
| Admin panel (manage everything) | ✅ the app runs on web (`npm run web`) and exposes every module | `app/app/(tabs)/more.tsx` |
| Database collections (15) | 🆕 all 15 backed by the store | `server/src/lib/store.js` |

## 2. UI PDF — screen by screen

| Screen | Status |
| --- | --- |
| Dashboard: 6 stat tiles, quick actions, weekly line chart, recent reports | ✅ |
| Patients: 4 stats, search + scan, list, Import / Export / Groups / Duplicates footer | 🆕 all four footer actions now work |
| Add patient (basic / address / additional, auto PID, DOB→age) | ✅ |
| Create report step 1 (patient, doctor, test tabs, dates, amounts, payment mode) | ✅ 🆕 real drafts |
| Reports list (4 stats, date ranges, status tabs, pagination) | ✅ 🆕 row action sheet |
| Create report step 2 (grouped params, auto H/L, remarks) | ✅ 🆕 technician field |
| Step 3 preview + report preview sheet (share / download / print / more) | ✅ 🆕 QR, barcode, stamps |
| More menu (Manage / Reports & Data / Settings & Support) | ✅ 🆕 commissions, transactions, subscription, roles rows |
| Drawer menu with profile, sections, app version | ✅ |

## 3. Business configuration (`.env` driven)

Every tunable business number now lives in `server/.env` (documented in
`server/.env.example`) and is read through `server/src/config/appConfig.js`:

| Variable | Used for |
| --- | --- |
| `DEFAULT_COMMISSION_PERCENT` | Commission % applied when a doctor is added without one |
| `MAX_DISCOUNT_PERCENT` | Cap on report discounts — the API rejects anything above it |
| `CURRENCY_SYMBOL` | Seeded lab settings / receipts |
| `TRIAL_DAYS`, `MONTHLY_PLAN_PRICE/DAYS`, `YEARLY_PLAN_PRICE/DAYS` | Subscription plans |
| `DEMO_OTP` | Login OTP until a real SMS gateway exists |

The safe subset (everything except the OTP) is exposed at `GET /api/config`;
the app reads it there (doctor form default commission, create-report
discount cap), so a `.env` change + server restart updates the whole system.

## 4. Deliberately not built

- **Native Super-Admin multi-tenant console** — the API exposes `/api/labs` and the
  subscription/plan data a super admin needs, and lab switching is in the app, but a
  separate hosted admin site is a different deployment and is out of this repo's scope.
- **Real SMS/OTP gateway & cloud PDF bucket** — demo OTP `123456` and on-device PDF
  generation stay until real provider credentials exist.

## 5. Verification performed

- **QR encoder** (`app/lib/qr.ts`) — matrices compared module-for-module against the
  reference `qrcode` implementation for versions 1, 3 and 5 (byte mode, EC level M,
  mask 0): **exact match** on all three.
- **Code 128 tables** — all 106 symbol patterns plus START-B and STOP compared against
  the reference `python-barcode` charset: **exact match**.
- **API** — every new endpoint exercised end-to-end against the running server
  (commission payout, payment collection, report duplicate / verify / delete / restore,
  subscription upgrade, test master update, patient import, duplicate finder,
  backup export + restore, notifications, analytics).
- **App** — `tsc --noEmit` clean (also with `--noUnusedLocals`), Metro web bundle
  builds all 2,5xx modules without errors.
