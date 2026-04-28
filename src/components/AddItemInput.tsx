import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, FONT, radii, type as type_, webOnly } from '../theme';

type QuantityOption = { label: string; value: string };

const FRIDGE_QUANTITIES: QuantityOption[] = [
  { label: 'a little', value: 'a little' },
  { label: 'medium', value: 'medium amount' },
  { label: 'a lot', value: 'a lot' },
];

const PANTRY_QUANTITIES: QuantityOption[] = [
  { label: 'running low', value: 'running low' },
  { label: 'some', value: 'some' },
  { label: 'plenty', value: 'plenty' },
];

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface Props {
  placeholder: string;
  onAdd: (name: string) => void;
  mode: 'fridge' | 'pantry';
}

export default function AddItemInput({ placeholder, onAdd, mode }: Props) {
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const [pendingItem, setPendingItem] = useState<string | null>(null);

  const quantities = mode === 'fridge' ? FRIDGE_QUANTITIES : PANTRY_QUANTITIES;
  const question = mode === 'fridge' ? 'how much have you got of' : 'how stocked is your';

  const handleAdd = () => {
    const trimmed = text.trim();
    if (trimmed) {
      setPendingItem(trimmed);
      setText('');
    }
  };

  const handleQuantitySelect = (quantity: string) => {
    if (pendingItem) {
      const formatted = `${capitalize(pendingItem)} (${quantity})`;
      onAdd(formatted);
      setPendingItem(null);
    }
  };

  if (pendingItem) {
    return (
      <View style={s.followUp}>
        <Text style={s.question}>
          {question}{' '}
          <Text style={s.itemHighlight}>{capitalize(pendingItem)}?</Text>
        </Text>
        <View style={s.optionsRow}>
          {quantities.map((q) => (
            <TouchableOpacity
              key={q.value}
              activeOpacity={0.85}
              style={[s.optionChip, webOnly({ cursor: 'pointer' })]}
              onPress={() => handleQuantitySelect(q.value)}
            >
              <Text style={s.optionTxt}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => setPendingItem(null)}
          hitSlop={10}
          style={[s.cancel, webOnly({ cursor: 'pointer' })]}
        >
          <Text style={s.cancelTxt}>nevermind</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.row}>
      <View style={s.inputWrap}>
        <TextInput
          style={[s.input, webOnly({ outlineStyle: 'none' })]}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          value={text}
          onChangeText={setText}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <View style={[s.underline, focus && s.underlineFocus]} />
      </View>
      <TouchableOpacity
        onPress={handleAdd}
        disabled={!text.trim()}
        activeOpacity={0.8}
        style={[
          s.add,
          !text.trim() && s.addEmpty,
          webOnly({ cursor: text.trim() ? 'pointer' : 'default' }),
        ]}
      >
        <Text style={[s.addTxt, !text.trim() && s.addTxtEmpty]}>add</Text>
        <Text style={[s.addArrow, !text.trim() && s.addTxtEmpty]}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 14,
  },
  inputWrap: { flex: 1 },
  input: {
    fontFamily: FONT.serifItalic,
    fontSize: 19,
    paddingVertical: 8,
    paddingHorizontal: 0,
    color: colors.ink,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  underline: { height: 1, backgroundColor: colors.hairline },
  underlineFocus: { height: 2, backgroundColor: colors.terracotta, marginTop: -1 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 10,
    gap: 6,
  },
  addEmpty: {},
  addTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 14,
    letterSpacing: 0.4,
    color: colors.terracotta,
    textTransform: 'lowercase',
  },
  addArrow: {
    fontFamily: FONT.serif,
    fontSize: 18,
    color: colors.terracotta,
    marginTop: -2,
  },
  addTxtEmpty: { color: colors.inkFaint },

  // follow-up
  followUp: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 22,
    backgroundColor: colors.paperWarm,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  question: {
    ...type_.subtitle,
    color: colors.inkSoft,
    marginBottom: 14,
  },
  itemHighlight: {
    fontFamily: FONT.serifBoldItalic,
    color: colors.ink,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.terracotta,
    borderRadius: radii.chip,
  },
  optionTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 13,
    letterSpacing: 0.3,
    color: colors.paper,
    textTransform: 'lowercase',
  },
  cancel: { marginTop: 12, alignSelf: 'flex-start' },
  cancelTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    textDecorationLine: 'underline',
  },
});
