import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../auth';
import { colors, type as type_, webOnly } from '../theme';

interface Props {
  kicker?: string;
  title: string;
  italic?: boolean;
  hint?: string;
  showLogout?: boolean;
}

export default function ScreenHeader({ kicker, title, italic = true, hint, showLogout = true }: Props) {
  const { logout } = useAuth();
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.titleCol}>
          {kicker && <Text style={[type_.eyebrow, s.kicker]}>{kicker}</Text>}
          <Text style={italic ? type_.displayItalic : type_.display}>{title}</Text>
          {hint && <Text style={[type_.subtitle, s.hint]}>{hint}</Text>}
        </View>
        {showLogout && (
          <TouchableOpacity onPress={logout} hitSlop={12} style={[s.logoutBtn, webOnly({ cursor: 'pointer' })]}>
            <Text style={s.logoutTxt}>sign out</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.rule} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  titleCol: { flex: 1, paddingRight: 16 },
  kicker: { marginBottom: 8 },
  hint: { marginTop: 12 },
  logoutBtn: { paddingTop: 6 },
  logoutTxt: {
    fontFamily: 'Fraunces_500Medium_Italic',
    fontSize: 14,
    color: colors.inkFaint,
    textDecorationLine: 'underline',
  },
  rule: { height: 1, backgroundColor: colors.hairline, marginTop: 22 },
});
