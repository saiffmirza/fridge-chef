import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Recipe } from '../types';
import { getFridgeItems, getPantryItems } from '../storage/storage';
import { getRecipeSuggestions } from '../services/gemini';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findRecipes = async () => {
    setLoading(true);
    setError(null);
    setExpanded(null);
    try {
      const [fridgeItems, pantryItems] = await Promise.all([
        getFridgeItems(),
        getPantryItems(),
      ]);

      const fridgeNames = fridgeItems.map((i) => i.name);
      const pantryNames = pantryItems.map((i) => i.name);

      if (fridgeNames.length === 0 && pantryNames.length === 0) {
        setError('Add some ingredients to your fridge or pantry first!');
        setLoading(false);
        return;
      }

      const results = await getRecipeSuggestions(fridgeNames, pantryNames);
      setRecipes(results);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.findButton} onPress={findRecipes} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.findButtonText}>Find Recipes</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => toggleExpand(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.meta}>
                {item.readyInMinutes != null && (
                  <Text style={styles.time}>{item.readyInMinutes} min</Text>
                )}
                {(item.missingIngredients?.length ?? 0) > 0 && (
                  <Text style={styles.missing}>
                    {item.missingIngredients!.length} missing
                  </Text>
                )}
              </View>
            </View>

            {item.summary && <Text style={styles.summary}>{item.summary}</Text>}

            {expanded === item.id && (
              <View style={styles.details}>
                {item.ingredients && item.ingredients.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    {item.ingredients.map((ing, i) => (
                      <Text key={i} style={styles.listItem}>
                        {item.missingIngredients?.includes(ing) ? '(missing) ' : ''}{ing}
                      </Text>
                    ))}
                  </View>
                )}

                {item.instructions && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Instructions</Text>
                    <Text style={styles.instructions}>{item.instructions}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.empty}>
              Tap "Find Recipes" to get AI-powered suggestions based on your ingredients.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  findButton: {
    backgroundColor: '#4CAF50',
    margin: 12,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  findButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  error: { color: '#f44336', textAlign: 'center', marginHorizontal: 12, marginBottom: 8 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  meta: { alignItems: 'flex-end' },
  time: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  missing: { fontSize: 12, color: '#FF9800', marginTop: 2 },
  summary: { fontSize: 14, color: '#555', marginTop: 8 },
  details: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6, color: '#333' },
  listItem: { fontSize: 14, color: '#444', marginLeft: 8, marginBottom: 3 },
  instructions: { fontSize: 14, color: '#444', lineHeight: 22 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15, paddingHorizontal: 20 },
});
