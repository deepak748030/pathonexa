export const colors = {
  primary: '#1668E3',
  primaryDark: '#0B3F8F',
  primaryLight: '#E8F1FE',
  primaryGradientEnd: '#2E7BF0',
  primaryForeground: '#FFFFFF',
  navy: '#0E2A6B',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  orange: '#F59E0B',
  orangeLight: '#FEF3C7',
  red: '#EF4444',
  redLight: '#FEE2E2',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  background: '#F4F7FC',
  card: '#FFFFFF',
  foreground: '#0F172A',
  mutedForeground: '#64748B',
  border: '#E2E8F0',
  muted: '#F1F5F9',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  placeholder: '#94A3B8',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
};

// Minimal radii — flat, clean, near-square surfaces.
export const radius = { xs: 2, sm: 4, md: 6, lg: 6, xl: 8, pill: 999 };

/**
 * App-wide spacing tokens.
 * hPad = 4 → every screen uses 4px left/right content padding.
 * gap  = 0 → all mapped lists/grids sit edge-to-edge with zero gaps
 *            (separated only by hairline dividers).
 */
export const spacing = {
  hPad: 4,
  gap: 0,
  headerPad: 4,
  input: 46,
  search: 46,
  button: 48,
  headerIcon: 34,
};

/** Alias — same numbers as spacing. */
export const sizes = spacing;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

/**
 * No shadows anywhere in the app. Surfaces are separated with hairline
 * borders instead of elevation. `shadow` is kept as an alias so existing
 * spreads stay valid, but it never produces elevation.
 */
export const flat = {
  borderWidth: 1,
  borderColor: colors.border,
};

export const shadow = flat;

export const hairline = { borderBottomWidth: 1, borderBottomColor: colors.border };
