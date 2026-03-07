export interface FridgeItem {
  id: string;
  name: string;
  expiresAt?: string; // ISO date string
  addedAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  readyInMinutes?: number;
  sourceUrl?: string;
  summary?: string;
  instructions?: string;
  ingredients?: string[];
  missingIngredients?: string[];
}
