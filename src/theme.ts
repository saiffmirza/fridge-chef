import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  paper: '#FAF6EC',
  paperWarm: '#F4ECD8',
  paperEdge: '#EBE3CC',
  ink: '#2A2520',
  inkSoft: '#5C5247',
  inkFaint: '#9A8F84',
  hairline: 'rgba(42, 37, 32, 0.12)',
  hairlineSoft: 'rgba(42, 37, 32, 0.06)',

  terracotta: '#C25434',
  terracottaDeep: '#A23F1F',
  terracottaTint: '#EBCEBE',

  olive: '#6F7A3A',
  oliveTint: '#DDE0BD',

  butter: '#E2A93A',
  butterTint: '#F2D88E',

  fresh: '#6E8B47',
  warning: '#D08A1A',
  expired: '#B0381C',
};

export const FONT = {
  serif: 'Fraunces_500Medium',
  serifItalic: 'Fraunces_500Medium_Italic',
  serifBold: 'Fraunces_700Bold',
  serifBoldItalic: 'Fraunces_700Bold_Italic',
  sans: 'Manrope_400Regular',
  sansMed: 'Manrope_500Medium',
  sansSemi: 'Manrope_600SemiBold',
};

type T = TextStyle;

export const type: Record<string, T> = {
  hero: { fontFamily: FONT.serifBoldItalic, fontSize: 44, lineHeight: 46, letterSpacing: -1, color: colors.ink },
  display: { fontFamily: FONT.serifBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.6, color: colors.ink },
  displayItalic: { fontFamily: FONT.serifBoldItalic, fontSize: 32, lineHeight: 36, letterSpacing: -0.6, color: colors.ink },
  title: { fontFamily: FONT.serif, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: colors.ink },
  titleItalic: { fontFamily: FONT.serifItalic, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: colors.ink },
  subtitle: { fontFamily: FONT.serifItalic, fontSize: 17, lineHeight: 24, letterSpacing: -0.2, color: colors.inkSoft },
  bodyL: { fontFamily: FONT.sans, fontSize: 16, lineHeight: 24, color: colors.ink },
  body: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 20, color: colors.ink },
  bodyMed: { fontFamily: FONT.sansMed, fontSize: 14, lineHeight: 20, color: colors.ink },
  bodySemi: { fontFamily: FONT.sansSemi, fontSize: 14, lineHeight: 20, color: colors.ink },
  eyebrow: { fontFamily: FONT.sansSemi, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, color: colors.inkSoft, textTransform: 'uppercase' },
  micro: { fontFamily: FONT.sans, fontSize: 12, lineHeight: 16, color: colors.inkSoft },
  microMed: { fontFamily: FONT.sansMed, fontSize: 12, lineHeight: 16, color: colors.inkSoft },
};

export const space = {
  px: 1,
  '0.5': 2,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 32,
  '8': 40,
  '9': 56,
  '10': 72,
};

export const radii = { chip: 7, sm: 8, md: 12, lg: 14, xl: 20 };

export const MAX_CONTENT = 720;

export const shadow: { soft: ViewStyle; lift: ViewStyle } = {
  soft:
    Platform.select<ViewStyle>({
      ios: { shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 8px rgba(42,37,32,0.06)' } as unknown as ViewStyle,
      default: {},
    }) || {},
  lift:
    Platform.select<ViewStyle>({
      ios: { shadowColor: colors.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 18px rgba(42,37,32,0.10)' } as unknown as ViewStyle,
      default: {},
    }) || {},
};

export const webOnly = (s: Record<string, unknown>) =>
  Platform.OS === 'web' ? (s as unknown as ViewStyle & TextStyle) : ({} as ViewStyle & TextStyle);
