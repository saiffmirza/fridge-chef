import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { Recipe } from '../types';
import { getFridgeItems, getPantryItems } from '../storage/storage';
import { searchRecipesByIngredients, getRecipeDetails } from '../services/spoonacular';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fridgeItems, pantryItems] = await Promise.all([
        getFridgeItems(),
        getPantryItems(),
      ]);

      const allIngredients = [
        ...fridgeItems.map((i) => i.name),
        ...pantryItems.map((i) => i.name),
      ];

      if (allIngredients.length === 0) {
        setError('Add some ingredients to your fridge or pantry first!');
        setLoading(false);
        return;
      }

      const results = await searchRecipesByIngredients(allIngredients, 5);

      // Fetch details for each recipe to get readyInMinutes
      const detailed = await Promise.all(
        results.map(async (r) => {
          try {
            const details = await getRecipeDetails(r.id);
            return { ...r, readyInMinutes: details.readyInMinutes, sourceUrl: details.sourceUrl };
          } catch {
            return r;
          }
        }),
      );

      // Sort by readyInMinutes (quickest first)
      detailed.sort((a, b) => (a.readyInMinutes ?? 999) - (b.readyInMinutes ?? 999));

      setRecipes(detailed);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
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
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.sourceUrl && Linking.openURL(item.sourceUrl)}
          >
            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.meta}>
                {item.readyInMinutes && (
                  <Text style={styles.time}>{item.readyInMinutes} min</Text>
                )}
                <Text style={styles.ingredients}>
                  {item.usedIngredientCount} used / {item.missedIngredientCount} missing
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.empty}>
              Tap "Find Recipes" to get suggestions based on your ingredients.
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
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  image: { width: '100%', height: 180 },
  cardContent: { padding: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  ingredients: { fontSize: 13, color: '#888' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15, paddingHorizontal: 20 },
});
