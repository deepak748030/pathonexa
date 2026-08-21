// PathoNexa newapp — design tokens extracted from "pathonexa App UI Demo" PDF
export const C = {
  primary: '#1467E8',
  primaryDark: '#0B51CE',
  primaryDeep: '#0A49BE',
  headerTop: '#0E5BD8',
  headerBottom: '#1668E8',
  bg: '#F3F5FA',
  card: '#FFFFFF',
  border: '#E7ECF5',
  borderSoft: '#EEF2F9',
  text: '#101D35',
  sub: '#66748E',
  faint: '#9AA6BD',
  green: '#16A34A',
  greenSoft: '#E6F6EC',
  orange: '#F59E0B',
  orangeSoft: '#FEF3E0',
  red: '#EF4444',
  redSoft: '#FDEBEC',
  purple: '#7C3AED',
  purpleSoft: '#F1E9FE',
  pink: '#EC4899',
  pinkSoft: '#FDE9F1',
  blueSoft: '#E8F0FE',
  dark: '#1B2430',
  darker: '#141A24',
} as const;

export const R = {
  card: 16,
  field: 10,
  chip: 10,
} as const;

export const S = {
  h1: 22,
  h2: 17,
  h3: 15,
  body: 13.5,
  small: 12,
  tiny: 10.5,
} as const;

// Screen content intentionally sits close to the viewport edge.
export const PAGE_GUTTER = 4;
export const COMPACT_GAP = 4;

export const fmtINR = (n: number) => '₹' + n.toLocaleString('en-IN');

/* Plus Jakarta Sans — loaded via @expo-google-fonts (same package version as app/) */
export const F = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export function fontForWeight(w?: string | number): string {
  switch (String(w)) {
    case '800':
      return F.extrabold;
    case '700':
      return F.bold;
    case '600':
      return F.semibold;
    case '500':
      return F.medium;
    default:
      return F.regular;
  }
}
