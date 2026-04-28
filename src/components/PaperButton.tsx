import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, View } from 'react-native';
import { colors, FONT, radii, webOnly } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  trailing?: string;
  style?: ViewStyle;
  full?: boolean;
}

export default function PaperButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  trailing,
  style,
  full,
}: Props) {
  const isDisabled = disabled || loading;
  const v = variants[variant];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        s.base,
        v.container,
        full && s.full,
        isDisabled && { opacity: 0.55 },
        webOnly({ cursor: isDisabled ? 'default' : 'pointer' }),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} size="small" />
      ) : (
        <View style={s.row}>
          <Text style={[s.label, v.label]}>{label}</Text>
          {trailing ? <Text style={[s.trailing, v.label]}>{trailing}</Text> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: {
    fontFamily: FONT.sansSemi,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  trailing: { marginLeft: 10, fontSize: 16 },
});

const variants: Record<Variant, { container: ViewStyle; label: { color: string }; spinner: string }> = {
  primary: {
    container: { backgroundColor: colors.terracotta },
    label: { color: colors.paper },
    spinner: colors.paper,
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.ink },
    label: { color: colors.ink },
    spinner: colors.ink,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: colors.inkSoft },
    spinner: colors.inkSoft,
  },
};
