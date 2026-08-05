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
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
};

// Minimal radii — flat, clean, near-square surfaces.
export const radius = { xs: 2, sm: 4, md: 6, lg: 6, xl: 8, pill: 999 };

export const spacing = { hPad: 3, gap: 10 };

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
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
