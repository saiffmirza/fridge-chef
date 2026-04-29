import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, FONT, radii, shadow, type as type_, webOnly } from '../theme';
import DatePicker from './DatePicker';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function formatDate(d?: Date): string | null {
  if (!d) return null;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface Props {
  visible: boolean;
  itemName: string;
  value?: Date;
  dateLabel?: string;
  onRename?: (name: string) => void;
  onSelect: (date: Date) => void;
  onClear?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  onClose: () => void;
}

export default function EditModal({
  visible,
  itemName,
  value,
  dateLabel = 'expiry date',
  onRename,
  onSelect,
  onClear,
  onRemove,
  removeLabel = 'remove from fridge',
  onClose,
}: Props) {
  const [name, setName] = useState(itemName);
  const [nameFocus, setNameFocus] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(itemName);
      setPickerOpen(false);
    }
  }, [visible, itemName]);

  const commitNameAndClose = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== itemName && onRename) onRename(trimmed);
    onClose();
  };

  const handleSelect = (date: Date) => {
    onSelect(date);
    setPickerOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setPickerOpen(false);
  };

  const formatted = formatDate(value);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={commitNameAndClose}>
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={commitNameAndClose} />
        <View style={[s.sheet, shadow.lift]}>
          <View style={s.header}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={s.kicker}>edit</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
                style={[s.nameInput, webOnly({ outlineStyle: 'none' })]}
                returnKeyType="done"
                onSubmitEditing={commitNameAndClose}
              />
              <View style={[s.nameUnderline, nameFocus && s.nameUnderlineFocus]} />
            </View>
            <TouchableOpacity
              onPress={commitNameAndClose}
              hitSlop={12}
              style={[s.closeBtn, webOnly({ cursor: 'pointer' })]}
            >
              <Text style={s.closeTxt}>close</Text>
            </TouchableOpacity>
          </View>

          <View style={s.rule} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPickerOpen((v) => !v)}
            style={[s.dateRow, webOnly({ cursor: 'pointer' })]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.dateKicker}>{dateLabel}</Text>
              <Text style={s.dateValue}>
                {formatted ? `best by ${formatted}` : 'none set'}
              </Text>
            </View>
            <Text style={s.dateAction}>
              {pickerOpen ? 'close' : formatted ? 'change' : 'set'}
            </Text>
          </TouchableOpacity>

          {pickerOpen && (
            <View style={s.pickerWrap}>
              <View style={s.ruleSoft} />
              <DatePicker value={value} onSelect={handleSelect} onClear={onClear ? handleClear : undefined} />
            </View>
          )}

          {onRemove && (
            <View style={s.removeRow}>
              <TouchableOpacity
                onPress={onRemove}
                hitSlop={10}
                style={webOnly({ cursor: 'pointer' })}
              >
                <Text style={s.removeTxt}>{removeLabel}</Text>
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
  nameInput: {
    fontFamily: FONT.serifItalic,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.ink,
    paddingVertical: 4,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  nameUnderline: { height: 1, backgroundColor: colors.hairlineSoft },
  nameUnderlineFocus: { height: 2, backgroundColor: colors.terracotta, marginTop: -1 },
  closeBtn: { paddingTop: 4 },
  closeTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    textDecorationLine: 'underline',
  },
  rule: { height: 1, backgroundColor: colors.hairline, marginTop: 18 },
  ruleSoft: { height: 1, backgroundColor: colors.hairlineSoft },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  dateKicker: { ...type_.eyebrow, color: colors.inkFaint, marginBottom: 4 },
  dateValue: {
    fontFamily: FONT.serifItalic,
    fontSize: 17,
    color: colors.ink,
  },
  dateAction: {
    fontFamily: FONT.sansSemi,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.terracotta,
    textTransform: 'uppercase',
  },
  pickerWrap: { paddingBottom: 4 },

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
