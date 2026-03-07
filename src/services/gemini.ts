import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

const genAI = new GoogleGenerativeAI(API_KEY);

export async function getRecipeSuggestions(
  fridgeIngredients: string[],
  pantryIngredients: string[],
): Promise<Recipe[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a helpful chef. Based on the ingredients I have, suggest 2 to 5 recipes I can make, ranging from quickest to longest preparation time.

FRIDGE INGREDIENTS (prioritize using these, they may expire soon):
${fridgeIngredients.join(', ') || 'None'}

PANTRY STAPLES (always available):
${pantryIngredients.join(', ') || 'None'}

Respond ONLY with a valid JSON array, no markdown, no code fences. Each object must have:
- "title": recipe name
- "readyInMinutes": estimated total time
- "summary": 1-2 sentence description
- "ingredients": array of ingredient strings needed
- "instructions": step-by-step instructions as a single string
- "missingIngredients": array of ingredients not in my list that would be needed (can be empty)

Sort from quickest to longest. Only suggest recipes where the majority of main ingredients are available.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let parsed: any[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse recipe suggestions. Please try again.');
  }

  return parsed.map((r: any, i: number) => ({
    id: i + 1,
    title: r.title,
    image: '',
    usedIngredientCount: (r.ingredients?.length ?? 0) - (r.missingIngredients?.length ?? 0),
    missedIngredientCount: r.missingIngredients?.length ?? 0,
    readyInMinutes: r.readyInMinutes,
    summary: r.summary,
    instructions: r.instructions,
    ingredients: r.ingredients,
    missingIngredients: r.missingIngredients,
  }));
}
