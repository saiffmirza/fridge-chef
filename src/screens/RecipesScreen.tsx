import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  deleteSavedRecipe,
  getRecipeSuggestions,
  getSavedRecipes,
  saveRecipe,
  SavedRecipeRecord,
} from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import PaperButton from '../components/PaperButton';
import RecipeDetailModal, { RecipeDetail } from '../components/RecipeDetailModal';
import SavedRecipesModal from '../components/SavedRecipesModal';
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

type DetailSource = { type: 'generated'; index: number } | { type: 'saved'; id: string };

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedList, setSavedList] = useState<SavedRecipeRecord[]>([]);
  const [savedIds, setSavedIds] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<RecipeDetail | null>(null);
  const [detailSource, setDetailSource] = useState<DetailSource | null>(null);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const loadSaved = useCallback(async () => {
    try {
      const list = await getSavedRecipes();
      setSavedList(list);
    } catch {
      // non-blocking — saved list is a nice-to-have
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // Reconcile saved-state for generated recipes whenever either list changes
  useEffect(() => {
    const next: Record<number, string> = {};
    recipes.forEach((r, i) => {
      const match = savedList.find((s) => s.title === r.title);
      if (match) next[i] = match._id;
    });
    setSavedIds(next);
  }, [recipes, savedList]);

  const findRecipes = async () => {
    setLoading(true);
    setError(null);
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

  const openGenerated = (index: number) => {
    setDetailRecipe(recipes[index]);
    setDetailSource({ type: 'generated', index });
    setDetailOpen(true);
  };

  const openSaved = (saved: SavedRecipeRecord) => {
    setDetailRecipe({
      title: saved.title,
      readyInMinutes: saved.readyInMinutes,
      summary: saved.summary,
      ingredients: saved.ingredients,
      steps: saved.steps,
    });
    setDetailSource({ type: 'saved', id: saved._id });
    setDetailOpen(true);
  };

  const handleSaveFromGenerated = async (index: number) => {
    const r = recipes[index];
    if (!r) return;
    try {
      const created = await saveRecipe({
        title: r.title,
        readyInMinutes: r.readyInMinutes,
        summary: r.summary,
        ingredients: r.ingredients,
        steps: r.steps,
      });
      setSavedIds((prev) => ({ ...prev, [index]: created._id }));
      setSavedList((prev) => [created, ...prev]);
    } catch {
      // swallow; silent failure for non-blocking action
    }
  };

  const handleUnsaveFromGenerated = async (index: number) => {
    const id = savedIds[index];
    if (!id) return;
    try {
      await deleteSavedRecipe(id);
      setSavedIds((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setSavedList((prev) => prev.filter((s) => s._id !== id));
    } catch {
      /* noop */
    }
  };

  const handleUnsaveFromSaved = async (id: string) => {
    try {
      await deleteSavedRecipe(id);
      setSavedList((prev) => prev.filter((s) => s._id !== id));
      // Also clear from savedIds if present
      setSavedIds((prev) => {
        const next: Record<number, string> = {};
        Object.entries(prev).forEach(([k, v]) => {
          if (v !== id) next[Number(k)] = v;
        });
        return next;
      });
    } catch {
      /* noop */
    }
  };

  const detailSaved =
    detailSource?.type === 'generated'
      ? Boolean(savedIds[detailSource.index])
      : detailSource?.type === 'saved';

  const handleDetailSave = async () => {
    if (!detailSource || !detailRecipe) return;
    if (detailSource.type === 'generated') {
      await handleSaveFromGenerated(detailSource.index);
    }
  };

  const handleDetailUnsave = async () => {
    if (!detailSource) return;
    if (detailSource.type === 'generated') {
      await handleUnsaveFromGenerated(detailSource.index);
    } else {
      await handleUnsaveFromSaved(detailSource.id);
      setDetailOpen(false);
    }
  };

  const showSavedLink = savedList.length >= 1;

  return (
    <View style={s.root}>
      <View style={s.frame}>
        <ScreenHeader
          kicker="Tonight"
          title="what to cook."
          italic
          hint={
            recipes.length > 0
              ? 'tap any recipe to read the full method.'
              : 'a few recipes from what you have on hand. press below.'
          }
        />

        {showSavedLink && (
          <View style={s.savedRow}>
            <TouchableOpacity
              onPress={() => setSavedModalOpen(true)}
              hitSlop={10}
              style={[s.savedLink, webOnly({ cursor: 'pointer' })]}
            >
              <Text style={s.savedLinkTxt}>
                saved <Text style={s.savedCount}>({savedList.length})</Text> →
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
            const num = String(index + 1).padStart(2, '0');
            const missingCount = item.missingCount ?? item.ingredients.filter((i) => i.missing).length;
            const isSaved = Boolean(savedIds[index]);
            return (
              <Animated.View style={{ opacity: fade }}>
                <View style={s.entry}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openGenerated(index)}
                    style={webOnly({ cursor: 'pointer' })}
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
                              +{missingCount}
                              <Text style={s.metaStar}>*</Text>
                            </Text>
                          </>
                        )}
                      </View>
                    </View>

                    <Text style={s.title}>{item.title}</Text>
                    {item.summary ? <Text style={s.summary}>{item.summary}</Text> : null}
                  </TouchableOpacity>

                  <View style={s.entryFoot}>
                    <Text style={s.openTxt} onPress={() => openGenerated(index)}>
                      read more →
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        isSaved ? handleUnsaveFromGenerated(index) : handleSaveFromGenerated(index)
                      }
                      hitSlop={10}
                      style={webOnly({ cursor: 'pointer' })}
                    >
                      <Text style={[s.saveTxt, isSaved && s.saveTxtActive]}>
                        {isSaved ? 'saved ✓' : 'save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          }}
        />
      </View>

      <RecipeDetailModal
        visible={detailOpen}
        recipe={detailRecipe}
        index={detailSource?.type === 'generated' ? detailSource.index : undefined}
        saved={detailSaved}
        onSave={handleDetailSave}
        onUnsave={handleDetailUnsave}
        onClose={() => setDetailOpen(false)}
      />

      <SavedRecipesModal
        visible={savedModalOpen}
        recipes={savedList}
        onClose={() => setSavedModalOpen(false)}
        onSelect={(r) => {
          setSavedModalOpen(false);
          // Slight delay so the saved modal close animation can begin before opening detail
          setTimeout(() => openSaved(r), 100);
        }}
        onDelete={handleUnsaveFromSaved}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: MAX_CONTENT },
  savedRow: {
    paddingHorizontal: 28,
    paddingTop: 0,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  savedLink: {},
  savedLinkTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 14,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
  savedCount: { color: colors.inkSoft, textDecorationLine: 'none' },
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
  metaStar: {
    fontFamily: FONT.serifBold,
    color: colors.terracotta,
  },
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
  saveTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
  saveTxtActive: {
    color: colors.olive,
    textDecorationLine: 'none',
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
