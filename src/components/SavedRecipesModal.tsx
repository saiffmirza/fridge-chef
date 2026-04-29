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
import { SavedRecipeRecord } from '../services/api';

interface Props {
  visible: boolean;
  recipes: SavedRecipeRecord[];
  onClose: () => void;
  onSelect: (recipe: SavedRecipeRecord) => void;
  onDelete: (id: string) => void;
}

export default function SavedRecipesModal({
  visible,
  recipes,
  onClose,
  onSelect,
  onDelete,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.root}>
        <View style={s.frame}>
          <View style={s.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={onClose}
              hitSlop={14}
              style={[s.closeBtn, webOnly({ cursor: 'pointer' })]}
              accessibilityLabel="close"
            >
              <Text style={s.closeTxt}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={s.header}>
            <Text style={type_.eyebrow}>The Collection</Text>
            <Text style={s.title}>saved recipes.</Text>
            <Text style={s.hint}>
              {recipes.length === 0
                ? 'nothing saved yet. tap save on a recipe to keep it here.'
                : `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} kept for later.`}
            </Text>
            <View style={s.headerRule} />
          </View>

          <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            {recipes.length === 0 ? (
              <View style={s.empty}>
                <View style={s.emptyDot} />
                <Text style={s.emptyTitle}>
                  An empty <Text style={s.emptyAccent}>shelf.</Text>
                </Text>
                <Text style={s.emptyBody}>
                  When a recipe catches your eye, tap save and it'll wait for you here.
                </Text>
              </View>
            ) : (
              recipes.map((r, i) => {
                const missingCount = r.ingredients.filter((ing) => ing.missing).length;
                const num = String(i + 1).padStart(2, '0');
                return (
                  <View key={r._id}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onSelect(r)}
                      style={[s.entry, webOnly({ cursor: 'pointer' })]}
                    >
                      <View style={s.entryHead}>
                        <Text style={s.entryNum}>no. {num}</Text>
                        <Text style={s.metaTxt}>
                          {r.readyInMinutes} min
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
                      <Text style={s.entryTitle}>{r.title}</Text>
                      {r.summary ? <Text style={s.entrySummary}>{r.summary}</Text> : null}
                      <View style={s.entryFoot}>
                        <Text style={s.openTxt}>open →</Text>
                        <TouchableOpacity
                          onPress={() => onDelete(r._id)}
                          hitSlop={10}
                          style={webOnly({ cursor: 'pointer' })}
                        >
                          <Text style={s.removeTxt}>remove</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                    {i < recipes.length - 1 && <View style={s.divider} />}
                  </View>
                );
              })
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
    paddingBottom: 4,
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

  header: { paddingHorizontal: 28, paddingBottom: 8 },
  title: {
    fontFamily: FONT.serifBoldItalic,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: 6,
  },
  hint: { ...type_.subtitle, color: colors.inkSoft, marginTop: 10 },
  headerRule: { height: 1, backgroundColor: colors.hairline, marginTop: 18 },

  body: { paddingBottom: 56 },
  divider: { height: 1, backgroundColor: colors.hairline, marginHorizontal: 28 },
  entry: { paddingHorizontal: 28, paddingVertical: 22 },
  entryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  entryTitle: {
    fontFamily: FONT.serifBold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  entrySummary: {
    ...type_.subtitle,
    color: colors.inkSoft,
    marginTop: 6,
  },
  entryFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  openTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
  removeTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.expired,
    textDecorationLine: 'underline',
  },

  empty: { paddingHorizontal: 28, paddingTop: 24 },
  emptyDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.terracotta,
    marginBottom: 14,
  },
  emptyTitle: { ...type_.title, color: colors.ink },
  emptyAccent: { fontFamily: FONT.serifItalic, color: colors.olive },
  emptyBody: {
    ...type_.bodyL,
    color: colors.inkSoft,
    marginTop: 10,
    maxWidth: 380,
  },
});
