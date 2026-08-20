export const colors = {
  primary: '#1668E3',
  primaryDark: '#0B4FBF',
  primaryLight: '#E8F1FE',
  primarySoft: '#F0F6FF',
  primaryGradientEnd: '#2B7AF0',
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
  teal: '#0EA5E9',
  tealLight: '#E0F2FE',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  background: '#F3F6FB',
  sheet: '#F3F6FB',
  card: '#FFFFFF',
  foreground: '#0F172A',
  mutedForeground: '#64748B',
  border: '#E6EAF2',
  muted: '#F1F5F9',
  inputBg: '#FFFFFF',
  inputBorder: '#D8DEE9',
  placeholder: '#94A3B8',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  tabInactive: '#94A3B8',
  headerBlue: '#1668E3',
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const spacing = {
  hPad: 14,
  gap: 10,
  headerPad: 16,
  input: 48,
  search: 46,
  button: 52,
  headerIcon: 36,
};

export const sizes = spacing;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

export const softShadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export const tabShadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: -4 },
  elevation: 12,
};

export const hairline = { borderBottomWidth: 1, borderBottomColor: colors.border };

export const toneMap = {
  primary: { fg: colors.primary, bg: colors.primaryLight },
  green: { fg: colors.green, bg: colors.greenLight },
  orange: { fg: colors.orange, bg: colors.orangeLight },
  purple: { fg: colors.purple, bg: colors.purpleLight },
  red: { fg: colors.red, bg: colors.redLight },
  teal: { fg: colors.teal, bg: colors.tealLight },
  pink: { fg: colors.pink, bg: colors.pinkLight },
} as const;
