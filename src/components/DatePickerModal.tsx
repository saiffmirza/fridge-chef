import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, FONT, MAX_CONTENT, radii, shadow, type as type_, webOnly } from '../theme';
import DatePicker from './DatePicker';

interface Props {
  visible: boolean;
  itemName: string;
  value?: Date;
  onSelect: (date: Date) => void;
  onClear?: () => void;
  onRemove?: () => void;
  onClose: () => void;
}

export default function DatePickerModal({
  visible,
  itemName,
  value,
  onSelect,
  onClear,
  onRemove,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[s.sheet, shadow.lift]}>
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.kicker}>set expiry</Text>
              <Text style={s.title}>{itemName}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={[s.closeBtn, webOnly({ cursor: 'pointer' })]}
            >
              <Text style={s.closeTxt}>close</Text>
            </TouchableOpacity>
          </View>
          <View style={s.rule} />

          <DatePicker
            value={value}
            onSelect={onSelect}
            onClear={onClear}
          />

          {onRemove && (
            <View style={s.removeRow}>
              <TouchableOpacity
                onPress={onRemove}
                hitSlop={10}
                style={webOnly({ cursor: 'pointer' })}
              >
                <Text style={s.removeTxt}>remove from fridge</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(42,37,32,0.42)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...Platform.select({ web: { justifyContent: 'center' as const }, default: {} }),
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.paper,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    ...Platform.select({
      web: { borderRadius: radii.xl },
      default: {},
    }),
    paddingTop: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
  },
  kicker: { ...type_.eyebrow, color: colors.inkFaint, marginBottom: 6 },
  title: {
    ...type_.titleItalic,
    fontSize: 22,
    color: colors.ink,
  },
  closeBtn: { paddingTop: 4 },
  closeTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    textDecorationLine: 'underline',
  },
  rule: { height: 1, backgroundColor: colors.hairline, marginTop: 16 },

  removeRow: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
    backgroundColor: colors.paperWarm,
    alignItems: 'flex-end',
    ...Platform.select({
      web: { borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl },
      default: {},
    }),
  },
  removeTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.expired,
    textDecorationLine: 'underline',
  },
});
