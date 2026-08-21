# PathoNexa — newapp 🧪

Fresh Expo app whose UI is built **from scratch, 1:1 per
`pathonexa App UI Demo-compressed.pdf`** (repo root). The original `app/`
folder is untouched. Dependency versions mirror `app/package.json`
(Expo SDK 54, React 19.1.0, RN 0.81.5, expo-router 6).

## Run

```bash
npm install --legacy-peer-deps
# web (port 8081)
EXPO_NO_TELEMETRY=1 EXPO_NO_DEPENDENCY_VALIDATION=1 EXPO_OFFLINE=1 npx expo start --web --port 8081 --lan
```

## Screens (per UI PDF)

| Screen | Route |
| --- | --- |
| Dashboard (stats, quick actions, line chart, recent reports, donut) | `/` |
| Patients (stats, search, list, import/export row) | `/patients` |
| Add New Patient (3-section form) | `/add-patient` |
| Reports (date chips, status tabs, pagination) | `/reports` |
| Create Report — 3-step wizard | `/create-report` |
| Report Preview (PDF viewer look) | `/report-preview` |
| More (lab card, manage/settings sections, logout) | `/more` |
| Side drawer (hamburger) | overlay |

## Notes

- **Font:** Plus Jakarta Sans (`@expo-google-fonts`, same version as `app/`),
  mapped per-weight via `components/T.tsx`.
- **Keyboard:** `softwareKeyboardLayoutMode: pan` keeps the floating tab bar
  in place; iOS gets keyboard-aware auto-scroll (`src/focusBus.ts`) so the
  focused input is never hidden.
- **Motion:** press-scale on buttons/tabs/FAB, fade-slide screen entry,
  animated drawer.
- **Charts/QR/stamp/signatures:** hand-built with `react-native-svg`
  (`components/charts.tsx`).
