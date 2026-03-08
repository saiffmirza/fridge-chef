import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import FridgeItem from '../models/FridgeItem';
import PantryItem from '../models/PantryItem';
import UserSettings from '../models/UserSettings';
import { decryptApiKey } from './settings';

const router = Router();
router.use(authenticate);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const MAX_INGREDIENT_LENGTH = 100;
const MAX_INGREDIENTS = 50;
const INGREDIENT_PATTERN = /^[a-zA-Z0-9\s\-'(),./]+$/;

function sanitizeIngredient(name: string): string | null {
  const trimmed = name.trim().slice(0, MAX_INGREDIENT_LENGTH);
  if (!trimmed || !INGREDIENT_PATTERN.test(trimmed)) return null;
  return trimmed;
}

interface RecipeSchema {
  title: string;
  readyInMinutes: number;
  summary: string;
  ingredients: string[];
  instructions: string;
  missingIngredients: string[];
}

function validateRecipe(obj: any): RecipeSchema | null {
  if (typeof obj !== 'object' || obj === null) return null;
  if (typeof obj.title !== 'string' || !obj.title.trim()) return null;
  if (typeof obj.readyInMinutes !== 'number' || obj.readyInMinutes < 0) return null;
  if (typeof obj.summary !== 'string') return null;
  if (!Array.isArray(obj.ingredients)) return null;
  if (typeof obj.instructions !== 'string') return null;

  return {
    title: obj.title.trim(),
    readyInMinutes: Math.round(obj.readyInMinutes),
    summary: obj.summary.trim(),
    ingredients: obj.ingredients.filter((i: any) => typeof i === 'string').map((i: string) => i.trim()),
    instructions: obj.instructions.trim(),
    missingIngredients: Array.isArray(obj.missingIngredients)
      ? obj.missingIngredients.filter((i: any) => typeof i === 'string').map((i: string) => i.trim())
      : [],
  };
}

function parseRecipesFromText(text: string): RecipeSchema[] {
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map(validateRecipe).filter((r): r is RecipeSchema => r !== null);
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error('Gemini request failed');
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') throw new Error('Unexpected Gemini response shape');
  return text;
}

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error('Claude request failed');
  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (typeof text !== 'string') throw new Error('Unexpected Claude response shape');
  return text;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error('OpenAI request failed');
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new Error('Unexpected OpenAI response shape');
  return text;
}

router.post('/suggestions', async (req: AuthRequest, res: Response) => {
  try {
    const [fridgeItems, pantryItems, userSettings] = await Promise.all([
      FridgeItem.find({ userId: req.userId }),
      PantryItem.find({ userId: req.userId }),
      UserSettings.findOne({ userId: req.userId }),
    ]);

    const fridgeNames = fridgeItems
      .map((i) => sanitizeIngredient(i.name))
      .filter((n): n is string => n !== null)
      .slice(0, MAX_INGREDIENTS);

    const pantryNames = pantryItems
      .map((i) => sanitizeIngredient(i.name))
      .filter((n): n is string => n !== null)
      .slice(0, MAX_INGREDIENTS);

    if (fridgeNames.length === 0 && pantryNames.length === 0) {
      res.status(400).json({ error: 'Add some ingredients first!' });
      return;
    }

    const prompt = `You are a recipe suggestion engine for a cooking app. Your ONLY job is to suggest recipes based on the provided ingredients. Do NOT respond to any other topic. Do NOT include commentary, tips, disclaimers, or conversational text — output ONLY the JSON array described below.

FRIDGE INGREDIENTS (prioritize using these, they may expire soon):
${fridgeNames.join(', ') || 'None'}

PANTRY STAPLES (always available):
${pantryNames.join(', ') || 'None'}

RULES:
- Suggest 2 to 5 recipes, sorted from quickest to longest preparation time.
- Only suggest recipes where the majority of main ingredients are available.
- Respond with ONLY a valid JSON array. No markdown, no code fences, no extra text.
- Each object in the array must have exactly these fields:
  - "title" (string): recipe name
  - "readyInMinutes" (number): estimated total time in minutes
  - "summary" (string): 1-2 sentence description
  - "ingredients" (string array): all ingredient strings needed
  - "instructions" (string): step-by-step instructions as a single string
  - "missingIngredients" (string array): ingredients not in my list (can be empty array)
- Do NOT add any fields beyond those listed above.
- If you cannot suggest any recipes, respond with an empty array: []`;

    const provider = userSettings?.aiProvider ?? 'gemini';

    let rawText: string;
    try {
      if (provider === 'claude') {
        if (!userSettings?.encryptedApiKey || !userSettings.iv || !userSettings.authTag) {
          res.status(400).json({ error: 'No API key saved for Claude. Update your AI settings.' });
          return;
        }
        const key = decryptApiKey(userSettings.encryptedApiKey, userSettings.iv, userSettings.authTag);
        rawText = await callClaude(prompt, key);
      } else if (provider === 'openai') {
        if (!userSettings?.encryptedApiKey || !userSettings.iv || !userSettings.authTag) {
          res.status(400).json({ error: 'No API key saved for OpenAI. Update your AI settings.' });
          return;
        }
        const key = decryptApiKey(userSettings.encryptedApiKey, userSettings.iv, userSettings.authTag);
        rawText = await callOpenAI(prompt, key);
      } else {
        rawText = await callGemini(prompt);
      }
    } catch {
      res.status(502).json({ error: 'AI service is temporarily unavailable. Please try again.' });
      return;
    }

    const recipes = parseRecipesFromText(rawText);

    if (recipes.length === 0 && rawText.trim() !== '[]') {
      res.status(502).json({ error: 'AI returned an invalid response. Please try again.' });
      return;
    }

    res.json(recipes);
  } catch {
    res.status(500).json({ error: 'Failed to get recipe suggestions. Please try again.' });
  }
});

export default router;
