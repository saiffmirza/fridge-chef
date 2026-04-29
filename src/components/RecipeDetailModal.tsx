import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, FONT, MAX_CONTENT, type as type_, webOnly } from '../theme';

export interface RecipeDetail {
  title: string;
  readyInMinutes: number;
  summary: string;
  ingredients: { text: string; missing: boolean; alternatives: string[] }[];
  steps: string[];
}

interface Props {
  visible: boolean;
  recipe: RecipeDetail | null;
  index?: number;
  saved: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  onClose: () => void;
}

export default function RecipeDetailModal({
  visible,
  recipe,
  index,
  saved,
  onSave,
  onUnsave,
  onClose,
}: Props) {
  if (!recipe) return null;
  const missingCount = recipe.ingredients.filter((i) => i.missing).length;
  const num = typeof index === 'number' ? String(index + 1).padStart(2, '0') : null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.root}>
        <View style={s.frame}>
          <View style={s.topBar}>
            {(onSave || onUnsave) ? (
              <TouchableOpacity
                onPress={saved ? onUnsave : onSave}
                hitSlop={12}
                style={[s.saveBtn, webOnly({ cursor: 'pointer' })]}
              >
                <Text style={[s.saveTxt, saved && s.saveTxtActive]}>
                  {saved ? 'saved ✓' : 'save'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity
              onPress={onClose}
              hitSlop={14}
              style={[s.closeBtn, webOnly({ cursor: 'pointer' })]}
              accessibilityLabel="close"
            >
              <Text style={s.closeTxt}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={s.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={s.metaRow}>
              {num && <Text style={s.entryNum}>no. {num}</Text>}
              <Text style={s.metaTxt}>
                {recipe.readyInMinutes} min
                {missingCount > 0 && (
                  <>
                    <Text style={s.metaSep}> · </Text>
                    <Text style={[s.metaTxt, { color: colors.warning }]}>
                      +{missingCount}
                      <Text style={s.metaStar}>*</Text>
                    </Text>
                  </>
                )}
              </Text>
            </View>

            <Text style={s.title}>{recipe.title}</Text>

            {recipe.summary ? <Text style={s.summary}>{recipe.summary}</Text> : null}

            {recipe.ingredients.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>ingredients</Text>
                <View style={s.sectionRule} />
                {recipe.ingredients.map((ing, i) => (
                  <View key={i} style={s.ingRow}>
                    <Text style={s.ingDash}>·</Text>
                    <View style={s.ingBody}>
                      <Text style={[s.ingTxt, ing.missing && s.ingMissingTxt]}>
                        {ing.text}
                        {ing.missing && <Text style={s.ingStar}>*</Text>}
                      </Text>
                      {ing.missing && ing.alternatives.length > 0 && (
                        <Text style={s.altTxt}>
                          <Text style={s.altStar}>*</Text>or {ing.alternatives.join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {recipe.steps.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>method</Text>
                <View style={s.sectionRule} />
                {recipe.steps.map((step, i) => (
                  <View key={i} style={s.stepRow}>
                    <Text style={s.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                    <Text style={s.stepTxt}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: MAX_CONTENT },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 8,
  },
  saveBtn: {},
  saveTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 15,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
  saveTxtActive: {
    fontFamily: FONT.serifItalic,
    color: colors.olive,
    textDecorationLine: 'none',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    fontFamily: FONT.serif,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 28,
  },

  body: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 56,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  entryNum: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    letterSpacing: 0.6,
  },
  metaTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: colors.olive,
    textTransform: 'uppercase',
  },
  metaSep: { color: colors.inkFaint, fontSize: 12 },
  metaStar: {
    fontFamily: FONT.serifBold,
    color: colors.terracotta,
  },
  title: {
    fontFamily: FONT.serifBold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  summary: {
    ...type_.subtitle,
    color: colors.inkSoft,
    marginTop: 12,
  },

  section: { marginTop: 28 },
  sectionLabel: { ...type_.eyebrow, color: colors.terracotta },
  sectionRule: { height: 1, backgroundColor: colors.hairline, marginTop: 6, marginBottom: 14 },

  ingRow: { flexDirection: 'row', marginBottom: 10 },
  ingDash: {
    fontFamily: FONT.serif,
    fontSize: 14,
    color: colors.inkFaint,
    width: 18,
    paddingTop: 1,
  },
  ingBody: { flex: 1 },
  ingTxt: {
    fontFamily: FONT.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  ingMissingTxt: { color: colors.inkSoft },
  ingStar: {
    fontFamily: FONT.serifBold,
    color: colors.terracotta,
    fontSize: 16,
  },
  altTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 3,
    lineHeight: 18,
  },
  altStar: {
    fontFamily: FONT.serifBold,
    color: colors.terracotta,
    fontStyle: 'normal',
  },

  stepRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  stepNum: {
    fontFamily: FONT.serifItalic,
    fontSize: 14,
    color: colors.terracotta,
    letterSpacing: 0.6,
    width: 36,
    paddingTop: 2,
  },
  stepTxt: {
    flex: 1,
    fontFamily: FONT.sans,
    fontSize: 16,
    lineHeight: 26,
    color: colors.ink,
  },
});
