import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { classifyExpiryItems, EstimateContext, ExpiryContext } from '../services/api';
import { colors, FONT, MAX_CONTENT, radii, shadow, type as type_, webOnly } from '../theme';

const MAX_ITEMS = 10;

export type PurchaseAge = 'today' | 'yesterday' | 'few-days' | 'week';

const PURCHASE_OPTIONS: { value: PurchaseAge; label: string; daysAgo: number }[] = [
  { value: 'today', label: 'today', daysAgo: 0 },
  { value: 'yesterday', label: 'yesterday', daysAgo: 1 },
  { value: 'few-days', label: 'couple of days ago', daysAgo: 2 },
  { value: 'week', label: 'a week ago', daysAgo: 7 },
];

export function purchaseDaysAgo(age: PurchaseAge): number {
  return PURCHASE_OPTIONS.find((o) => o.value === age)?.daysAgo ?? 0;
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

function questionFor(ctx: EstimateContext): string {
  if (ctx === 'made') return 'when did you make it?';
  if (ctx === 'opened') return 'when did you open it?';
  return 'when did you buy it?';
}

export interface FridgeBulkResult {
  name: string;
  daysAgo: number;
  context: EstimateContext;
}

interface CommonProps {
  visible: boolean;
  onClose: () => void;
  saving?: boolean;
}

interface FridgeProps extends CommonProps {
  mode: 'fridge';
  onConfirm: (items: FridgeBulkResult[]) => void;
}

interface PantryProps extends CommonProps {
  mode: 'pantry';
  onConfirm: (items: { name: string }[]) => void;
}

type Props = FridgeProps | PantryProps;

type Step = 'list' | 'classifying' | 'questions';

export default function BulkAddModal(props: Props) {
  const { visible, onClose, mode, saving } = props;
  const [step, setStep] = useState<Step>('list');
  const [names, setNames] = useState<string[]>(['']);
  const [ages, setAges] = useState<Record<number, PurchaseAge>>({});
  const [contexts, setContexts] = useState<Record<number, EstimateContext>>({});
  const [flagged, setFlagged] = useState<Record<number, true>>({});
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      setStep('list');
      setNames(['']);
      setAges({});
      setContexts({});
      setFlagged({});
    }
  }, [visible]);

  const cleanedEntries = names
    .map((n, i) => ({ name: n.trim(), index: i }))
    .filter((e) => e.name.length > 0);
  const cleanedNames = cleanedEntries.map((e) => e.name);
  const hasFlagged = Object.keys(flagged).length > 0;
  const canConfirmList = cleanedNames.length > 0 && !hasFlagged;

  const updateName = (idx: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
    if (flagged[idx]) {
      setFlagged((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  const removeRow = (idx: number) => {
    setNames((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx)));
    setFlagged({});
    setAges({});
    setContexts({});
  };

  const addRow = () => {
    if (names.length >= MAX_ITEMS) return;
    setNames((prev) => [...prev, '']);
    setTimeout(() => inputRefs.current[names.length]?.focus(), 50);
  };

  const handleListConfirm = async () => {
    if (!canConfirmList) return;
    if (mode === 'pantry') {
      props.onConfirm(cleanedNames.map((n) => ({ name: capitalize(n) })));
      return;
    }

    setStep('classifying');
    try {
      const results = await classifyExpiryItems(
        cleanedNames.map((n) => ({ name: capitalize(n) })),
      );

      const byName = new Map<string, ExpiryContext>(
        results.map((r) => [r.name, r.context]),
      );

      const newFlagged: Record<number, true> = {};
      const newContexts: Record<number, EstimateContext> = {};
      cleanedEntries.forEach((entry) => {
        const ctx = byName.get(capitalize(entry.name)) ?? 'unrecognized';
        if (ctx === 'unrecognized') {
          newFlagged[entry.index] = true;
        } else {
          newContexts[entry.index] = ctx;
        }
      });

      if (Object.keys(newFlagged).length > 0) {
        setFlagged(newFlagged);
        setStep('list');
        return;
      }

      setContexts(newContexts);
      setStep('questions');
    } catch {
      // Network or backend failure: don't punish the user; default everything to "bought".
      const fallback: Record<number, EstimateContext> = {};
      cleanedEntries.forEach((entry) => {
        fallback[entry.index] = 'bought';
      });
      setContexts(fallback);
      setStep('questions');
    }
  };

  const handleAgeSelect = (idx: number, age: PurchaseAge) => {
    setAges((prev) => ({ ...prev, [idx]: age }));
  };

  const allAnswered = cleanedEntries.every((e) => ages[e.index] !== undefined);

  const handleQuestionsConfirm = () => {
    if (mode !== 'fridge' || !allAnswered) return;
    const results: FridgeBulkResult[] = cleanedEntries.map((entry) => ({
      name: capitalize(entry.name),
      daysAgo: purchaseDaysAgo(ages[entry.index]),
      context: contexts[entry.index] ?? 'bought',
    }));
    props.onConfirm(results);
  };

  const heading =
    step === 'list'
      ? mode === 'fridge'
        ? "what's in the fridge?"
        : 'what staples are on the shelf?'
      : step === 'classifying'
        ? 'thinking…'
        : 'a couple of follow-ups.';

  const sub =
    step === 'list'
      ? mode === 'fridge'
        ? 'list up to ten things. we will work out how long each one has.'
        : 'list up to ten staples. they quietly join every recipe.'
      : step === 'classifying'
        ? 'reading the list.'
        : 'this helps us estimate how long each one will keep.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[s.sheet, shadow.lift]}>
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.kicker}>{mode === 'fridge' ? 'add to fridge' : 'add to pantry'}</Text>
              <Text style={s.title}>{heading}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={[s.closeBtn, webOnly({ cursor: 'pointer' })]}
            >
              <Text style={s.closeTxt}>close</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.sub}>{sub}</Text>
          <View style={s.rule} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.body}
            showsVerticalScrollIndicator={false}
          >
            {step === 'list' && (
              <ListStep
                names={names}
                flagged={flagged}
                inputRefs={inputRefs}
                onChange={updateName}
                onRemove={removeRow}
                placeholder={
                  mode === 'fridge'
                    ? 'tomatoes, basil, half a lemon…'
                    : 'olive oil, flaky salt, soy sauce…'
                }
              />
            )}

            {step === 'classifying' && (
              <View style={s.classifying}>
                <ActivityIndicator color={colors.terracotta} size="small" />
                <Text style={s.classifyingTxt}>reading the list…</Text>
              </View>
            )}

            {step === 'questions' && (
              <QuestionsStep
                entries={cleanedEntries}
                contexts={contexts}
                ages={ages}
                onSelect={handleAgeSelect}
              />
            )}

            {step === 'list' && names.length < MAX_ITEMS && (
              <TouchableOpacity
                onPress={addRow}
                hitSlop={8}
                style={[s.addAnother, webOnly({ cursor: 'pointer' })]}
              >
                <Text style={s.addAnotherTxt}>+ add another</Text>
              </TouchableOpacity>
            )}

            {step === 'list' && (
              <Text style={s.count}>
                {cleanedNames.length} of {MAX_ITEMS}
              </Text>
            )}
          </ScrollView>

          <View style={s.footer}>
            {step === 'questions' && !saving && (
              <TouchableOpacity
                onPress={() => setStep('list')}
                hitSlop={10}
                style={webOnly({ cursor: 'pointer' })}
              >
                <Text style={s.backTxt}>back</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={step === 'list' ? handleListConfirm : handleQuestionsConfirm}
              disabled={
                saving ||
                step === 'classifying' ||
                (step === 'list' ? !canConfirmList : !allAnswered)
              }
              style={[
                s.confirmBtn,
                ((step === 'list' && !canConfirmList) ||
                  (step === 'questions' && !allAnswered) ||
                  step === 'classifying' ||
                  saving) &&
                  s.confirmBtnDisabled,
                webOnly({
                  cursor:
                    saving ||
                    step === 'classifying' ||
                    (step === 'list' ? !canConfirmList : !allAnswered)
                      ? 'default'
                      : 'pointer',
                }),
              ]}
            >
              {saving || step === 'classifying' ? (
                <ActivityIndicator color={colors.paper} size="small" />
              ) : (
                <Text style={s.confirmTxt}>
                  {step === 'list'
                    ? mode === 'fridge'
                      ? 'next'
                      : 'add to pantry'
                    : 'add to fridge'}
                  {' '}→
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ListStepProps {
  names: string[];
  flagged: Record<number, true>;
  inputRefs: React.MutableRefObject<(TextInput | null)[]>;
  onChange: (idx: number, value: string) => void;
  onRemove: (idx: number) => void;
  placeholder: string;
}

function ListStep({ names, flagged, inputRefs, onChange, onRemove, placeholder }: ListStepProps) {
  return (
    <View>
      {names.map((value, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const isFlagged = !!flagged[idx];
        return (
          <View key={idx} style={s.inputRow}>
            <Text style={s.num}>{num}</Text>
            <View style={s.inputWrap}>
              <TextInput
                ref={(r) => {
                  inputRefs.current[idx] = r;
                }}
                value={value}
                onChangeText={(v) => onChange(idx, v)}
                placeholder={idx === 0 ? placeholder : ''}
                placeholderTextColor={colors.inkFaint}
                style={[s.input, webOnly({ outlineStyle: 'none' })]}
                returnKeyType="next"
              />
              <View style={[s.underline, isFlagged && s.underlineError]} />
              {isFlagged && (
                <Text style={s.errorHint}>
                  we don't recognize this — try rewording or remove
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => onRemove(idx)}
              hitSlop={10}
              style={[s.rowRemove, webOnly({ cursor: 'pointer' })]}
            >
              <Text style={s.rowRemoveTxt}>×</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

interface QuestionsStepProps {
  entries: { name: string; index: number }[];
  contexts: Record<number, EstimateContext>;
  ages: Record<number, PurchaseAge>;
  onSelect: (idx: number, age: PurchaseAge) => void;
}

function QuestionsStep({ entries, contexts, ages, onSelect }: QuestionsStepProps) {
  return (
    <View>
      {entries.map((entry) => {
        const selected = ages[entry.index];
        const ctx = contexts[entry.index] ?? 'bought';
        return (
          <View key={entry.index} style={s.qRow}>
            <Text style={s.qName}>{entry.name}</Text>
            <Text style={s.qPrompt}>{questionFor(ctx)}</Text>
            <View style={s.qChips}>
              {PURCHASE_OPTIONS.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onSelect(entry.index, opt.value)}
                    activeOpacity={0.85}
                    style={[
                      s.qChip,
                      isSelected && s.qChipSelected,
                      webOnly({ cursor: 'pointer' }),
                    ]}
                  >
                    <Text style={[s.qChipTxt, isSelected && s.qChipTxtSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
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
    maxWidth: MAX_CONTENT,
    maxHeight: '90%',
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
    paddingHorizontal: 24,
  },
  kicker: { ...type_.eyebrow, color: colors.inkFaint, marginBottom: 6 },
  title: {
    ...type_.displayItalic,
    fontSize: 26,
    lineHeight: 30,
    color: colors.ink,
  },
  closeBtn: { paddingTop: 4 },
  closeTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    textDecorationLine: 'underline',
  },
  sub: {
    ...type_.subtitle,
    color: colors.inkSoft,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  rule: { height: 1, backgroundColor: colors.hairline, marginTop: 18 },
  body: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  num: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    width: 26,
    paddingTop: 14,
  },
  inputWrap: { flex: 1 },
  input: {
    fontFamily: FONT.serifItalic,
    fontSize: 18,
    color: colors.ink,
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  underline: { height: 1, backgroundColor: colors.hairline },
  underlineError: { height: 2, backgroundColor: colors.expired, marginTop: -1 },
  errorHint: {
    fontFamily: FONT.serifItalic,
    fontSize: 12,
    color: colors.expired,
    marginTop: 6,
  },

  rowRemove: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 8,
  },
  rowRemoveTxt: {
    fontFamily: FONT.serif,
    fontSize: 22,
    color: colors.inkFaint,
    lineHeight: 22,
  },

  addAnother: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  addAnotherTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.terracotta,
    textTransform: 'lowercase',
  },
  count: {
    ...type_.micro,
    marginTop: 14,
    color: colors.inkFaint,
  },

  classifying: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 14,
  },
  classifyingTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 15,
    color: colors.inkSoft,
  },

  qRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  qName: {
    ...type_.titleItalic,
    fontSize: 20,
    color: colors.ink,
  },
  qPrompt: {
    ...type_.subtitle,
    color: colors.inkSoft,
    fontSize: 14,
    marginTop: 2,
    marginBottom: 10,
  },
  qChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  qChipSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  qChipTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 13,
    color: colors.ink,
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },
  qChipTxtSelected: { color: colors.paper },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.paperWarm,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    ...Platform.select({
      web: { borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl },
      default: {},
    }),
  },
  backTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 14,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.inkFaint },
  confirmTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 14,
    letterSpacing: 0.4,
    color: colors.paper,
    textTransform: 'lowercase',
  },
});
