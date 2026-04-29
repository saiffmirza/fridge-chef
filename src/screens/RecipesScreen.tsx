import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getRecipeSuggestions } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import PaperButton from '../components/PaperButton';
import { colors, FONT, MAX_CONTENT, type as type_, webOnly } from '../theme';

interface Ingredient {
  text: string;
  missing: boolean;
  alternatives: string[];
}

interface Recipe {
  title: string;
  readyInMinutes: number;
  summary: string;
  ingredients: Ingredient[];
  steps: string[];
  missingCount: number;
}

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const findRecipes = async () => {
    setLoading(true);
    setError(null);
    setExpanded(null);
    fade.setValue(0);
    try {
      const results = await getRecipeSuggestions();
      setRecipes(results);
      Animated.timing(fade, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } catch (e) {
      setError(e instanceof Error ? e.message.toLowerCase() : 'something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.frame}>
      <ScreenHeader
        kicker="Tonight"
        title="what to cook."
        italic
        hint={
          recipes.length > 0
            ? 'tap any recipe for ingredients and steps.'
            : 'a few recipes from what you have on hand. press below.'
        }
      />

      <View style={s.actionRow}>
        <PaperButton
          label={recipes.length === 0 ? 'cook something' : 'try again'}
          trailing="→"
          onPress={findRecipes}
          loading={loading}
          full
        />
      </View>

      {error && (
        <View style={s.errorBlock}>
          <Text style={s.errorEyebrow}>something went sideways</Text>
          <Text style={s.errorTxt}>{error}</Text>
        </View>
      )}

      <FlatList
        data={recipes}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.divider} />}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>
                Nothing on the menu <Text style={s.emptyTitleAccent}>yet.</Text>
              </Text>
              <Text style={s.emptyBody}>
                Suggestions appear here, sorted from quickest to longest. Add a few things to your
                fridge or pantry first, then tap{' '}
                <Text style={s.emptyTextAccent}>cook something</Text>.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const isOpen = expanded === index;
          const num = String(index + 1).padStart(2, '0');
          const missingCount = item.missingCount ?? item.ingredients.filter((i) => i.missing).length;
          return (
            <Animated.View style={{ opacity: fade }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(isOpen ? null : index)}
                style={[s.entry, webOnly({ cursor: 'pointer' })]}
              >
                <View style={s.entryHead}>
                  <Text style={s.entryNum}>no. {num}</Text>
                  <View style={s.entryDots}>
                    <Text style={s.metaTxt}>
                      {item.readyInMinutes != null ? `${item.readyInMinutes} min` : ''}
                    </Text>
                    {missingCount > 0 && (
                      <>
                        <Text style={s.metaSep}> · </Text>
                        <Text style={[s.metaTxt, { color: colors.warning }]}>
                          {missingCount} recommended
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                <Text style={s.title}>{item.title}</Text>

                {item.summary ? (
                  <Text style={s.summary}>{item.summary}</Text>
                ) : null}

                <Text style={s.toggle}>{isOpen ? 'close' : 'read more →'}</Text>

                {isOpen && (
                  <View style={s.details}>
                    {item.ingredients?.length > 0 && (
                      <View style={s.section}>
                        <Text style={s.sectionLabel}>ingredients</Text>
                        <View style={s.sectionRule} />
                        {item.ingredients.map((ing, i) => (
                          <View key={i} style={s.ingRow}>
                            <Text style={s.ingDash}>·</Text>
                            <View style={s.ingBody}>
                              <View style={s.ingMain}>
                                <Text style={[s.ingTxt, ing.missing && s.ingMissingTxt]}>
                                  {ing.text}
                                </Text>
                                {ing.missing && (
                                  <View style={s.recBadge}>
                                    <Text style={s.recBadgeTxt}>recommended</Text>
                                  </View>
                                )}
                              </View>
                              {ing.missing && ing.alternatives.length > 0 && (
                                <Text style={s.altTxt}>
                                  or {ing.alternatives.join(', ')}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {item.steps?.length > 0 && (
                      <View style={s.section}>
                        <Text style={s.sectionLabel}>method</Text>
                        <View style={s.sectionRule} />
                        {item.steps.map((step, i) => (
                          <View key={i} style={s.stepRow}>
                            <Text style={s.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                            <Text style={s.stepTxt}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: MAX_CONTENT },
  actionRow: {
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 18,
  },
  list: { paddingBottom: 48 },
  divider: { height: 1, backgroundColor: colors.hairline, marginHorizontal: 28, marginVertical: 4 },

  errorBlock: { paddingHorizontal: 28, paddingVertical: 18 },
  errorEyebrow: { ...type_.eyebrow, color: colors.expired },
  errorTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 16,
    color: colors.expired,
    marginTop: 4,
  },

  entry: {
    paddingHorizontal: 28,
    paddingVertical: 22,
  },
  entryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  entryNum: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    letterSpacing: 0.6,
  },
  entryDots: { flexDirection: 'row', alignItems: 'center' },
  metaTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: colors.olive,
    textTransform: 'uppercase',
  },
  metaSep: { color: colors.inkFaint, fontSize: 12 },
  title: {
    fontFamily: FONT.serifBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  summary: {
    ...type_.subtitle,
    color: colors.inkSoft,
    marginTop: 8,
  },
  toggle: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.terracotta,
    marginTop: 14,
    textDecorationLine: 'underline',
  },

  details: { marginTop: 16 },
  section: { marginTop: 18 },
  sectionLabel: { ...type_.eyebrow, color: colors.terracotta },
  sectionRule: { height: 1, backgroundColor: colors.hairline, marginTop: 6, marginBottom: 12 },
  ingRow: { flexDirection: 'row', marginBottom: 8 },
  ingDash: {
    fontFamily: FONT.serif,
    fontSize: 14,
    color: colors.inkFaint,
    width: 18,
    paddingTop: 1,
  },
  ingBody: { flex: 1 },
  ingMain: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  ingTxt: {
    fontFamily: FONT.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    flexShrink: 1,
  },
  ingMissingTxt: { color: colors.inkSoft },
  recBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: colors.butterTint,
    borderRadius: 4,
  },
  recBadgeTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#7A5A1A',
    textTransform: 'uppercase',
  },
  altTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 3,
    lineHeight: 18,
  },

  stepRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  stepNum: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.terracotta,
    letterSpacing: 0.6,
    width: 32,
    paddingTop: 2,
  },
  stepTxt: {
    flex: 1,
    fontFamily: FONT.sans,
    fontSize: 15,
    lineHeight: 24,
    color: colors.ink,
  },

  empty: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  emptyTitle: { ...type_.title, color: colors.ink },
  emptyTitleAccent: { fontFamily: FONT.serifItalic, color: colors.olive },
  emptyBody: {
    ...type_.bodyL,
    color: colors.inkSoft,
    marginTop: 10,
    maxWidth: 420,
  },
  emptyTextAccent: {
    fontFamily: FONT.serifItalic,
    color: colors.terracotta,
  },
});
