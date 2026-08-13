# PathoNexa App 📱🧪

Lab Management mobile/web app built with **Expo (React Native) + Expo Router**.
It is **fully connected to the PathoNexa backend** (`../server`) — every screen
pulls live data from the REST API, and gracefully flags "server offline" with
sample data when the backend is not running.

---

## ✨ Features

| Screen | Highlights |
| --- | --- |
| 🔐 **Login / OTP** | 10-digit mobile → OTP (demo `123456`), resend timer, offline banner |
| 📊 **Dashboard** | 6 live stat cards, last-7-days revenue chart, quick actions, recent reports |
| 🧑‍🤝‍🧑 **Patients** | Search, gender filter chips, weekly stats, tap a patient → pre-filled report |
| 📋 **Reports** | Search + status filter chips, tap → full report preview |
| ➕ **Create Report** | Bottom-sheet pickers for patient / test / doctor, paid toggle |
| 🖨️ **Report Preview** | Server-loaded report, CBC parameter table, **Print** & **Download PDF** |
| ⚙️ **More** | Live server status (MongoDB / in-memory), lab profile, logout |

**Design system:** 4px left/right content padding, zero-gap mapped lists
(edge-to-edge with hairline dividers), flat surfaces, lucide icons,
custom animated bottom tab bar with gradient center FAB + haptics.

---

## 🚀 Run Locally (Local PC)

### 1. Start the backend first

```bash
cd ../server
npm install
npm run dev          # http://localhost:5000  (works even without MongoDB)
```

### 2. Run the app

```bash
cd app
npm install --legacy-peer-deps

# Web (easiest for a quick check)
EXPO_NO_TELEMETRY=1 npx expo start --web --port 8080

# Android emulator / Expo Go
npm run dev          # then press "a" (emulator) or scan the QR (phone)
```

> The app **auto-detects** the backend host: web → `localhost:5000`, Android
> emulator → `10.0.2.2:5000`, physical phone → your PC's LAN IP:5000.
> Override with `EXPO_PUBLIC_API_URL` (see `.env.example`).

### 3. Login

- Enter any 10-digit mobile number (e.g. `9876543210`).
- OTP: **`123456`** (demo OTP accepted by the backend).

---

## ⚙️ Configuration

| File | Purpose |
| --- | --- |
| `.env.example` | `EXPO_PUBLIC_API_URL` override |
| `lib/api.ts` | Base-URL resolution, JWT header, 12s timeout, friendly errors |
| `lib/theme.ts` | Colors, fonts, `spacing.hPad = 4`, `spacing.gap = 0` |
| `lib/auth.ts` | Zustand auth store (AsyncStorage session + JWT) |
| `lib/serverStatus.ts` | Live `/api/health` status used by the offline banner |

---

## 📁 Folder Structure

```
app/
├── app/                  # Expo Router file-based routes
│   ├── (tabs)/           # Dashboard, Patients, Reports, More + tab layout
│   ├── login.tsx         # OTP login flow
│   ├── add-patient.tsx   # New patient form (POST /patients)
│   ├── create-report.tsx # Report creation with pickers (POST /reports)
│   ├── report-preview.tsx# Report detail + print/PDF
│   └── menu.tsx          # Slide-in drawer
├── components/           # ScreenHeader, StatCard, Avatar, UI kit
├── lib/                  # api, auth, theme, labData, serverStatus
├── assets/images/        # App icons & illustrations
├── shims/                # react-native-ping stub (thermal printer)
└── app.json              # Expo config
```

---

## 🛠️ Scripts

```bash
npm run dev        # expo start (all platforms)
npm run web        # expo start --web
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
```

---

## ❓ Troubleshooting

| Problem | Fix |
| --- | --- |
| "Server offline — showing sample data" banner | Backend not running. Run `cd ../server && npm run dev`. |
| Android emulator can't connect | Use `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api` (or rely on auto-detect). |
| Phone can't connect | Phone & PC must be on the **same Wi-Fi**; firewall must allow port 5000. |
| OTP "Invalid OTP" | The demo OTP is exactly `123456`. |
| Port 8080 busy | `npx expo start --web --port 8081` |
