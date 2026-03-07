import { Recipe } from '../types';

const API_KEY = ''; // TODO: Add your Spoonacular API key
const BASE_URL = 'https://api.spoonacular.com';

export async function searchRecipesByIngredients(
  ingredients: string[],
  count: number = 5,
): Promise<Recipe[]> {
  const ingredientList = ingredients.join(',');
  const url = `${BASE_URL}/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientList)}&number=${count}&ranking=2&ignorePantry=false&apiKey=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Spoonacular API error: ${response.status}`);
  }

  const recipes: Recipe[] = await response.json();
  return recipes;
}

export async function getRecipeDetails(recipeId: number): Promise<Recipe> {
  const url = `${BASE_URL}/recipes/${recipeId}/information?apiKey=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Spoonacular API error: ${response.status}`);
  }

  return response.json();
}
