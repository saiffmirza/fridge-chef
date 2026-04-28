import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, FONT, radii } from '../theme';

type Tone = 'terracotta' | 'olive' | 'butter' | 'ink' | 'ghost';

interface Props {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const toneMap: Record<Tone, { bg: string; fg: string; border?: string }> = {
  terracotta: { bg: colors.terracottaTint, fg: colors.terracottaDeep },
  olive: { bg: colors.oliveTint, fg: '#4D5527' },
  butter: { bg: colors.butterTint, fg: '#7A5A1A' },
  ink: { bg: colors.ink, fg: colors.paper },
  ghost: { bg: 'transparent', fg: colors.inkSoft, border: colors.hairline },
};

export default function Chip({ label, tone = 'terracotta', size = 'sm', style }: Props) {
  const t = toneMap[tone];
  return (
    <View
      style={[
        s.chip,
        size === 'md' ? s.md : s.sm,
        { backgroundColor: t.bg },
        t.border ? { borderWidth: 1, borderColor: t.border } : null,
        style,
      ]}
    >
      <Text style={[s.txt, size === 'md' ? s.txtMd : s.txtSm, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    borderRadius: radii.chip,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  md: { paddingHorizontal: 12, paddingVertical: 6 },
  txt: {
    fontFamily: FONT.sansSemi,
    letterSpacing: 0.4,
    textTransform: 'lowercase',
  },
  txtSm: { fontSize: 11.5, lineHeight: 14 },
  txtMd: { fontSize: 13, lineHeight: 18 },
});
