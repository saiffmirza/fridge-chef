import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import FridgeItem from '../models/FridgeItem';
import PantryItem from '../models/PantryItem';

const router = Router();
router.use(authenticate);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

router.post('/suggestions', async (req: AuthRequest, res: Response) => {
  try {
    const [fridgeItems, pantryItems] = await Promise.all([
      FridgeItem.find({ userId: req.userId }),
      PantryItem.find({ userId: req.userId }),
    ]);

    const fridgeNames = fridgeItems.map((i) => i.name);
    const pantryNames = pantryItems.map((i) => i.name);

    if (fridgeNames.length === 0 && pantryNames.length === 0) {
      res.status(400).json({ error: 'Add some ingredients first!' });
      return;
    }

    const prompt = `You are a helpful chef. Based on the ingredients I have, suggest 2 to 5 recipes I can make, ranging from quickest to longest preparation time.

FRIDGE INGREDIENTS (prioritize using these, they may expire soon):
${fridgeNames.join(', ') || 'None'}

PANTRY STAPLES (always available):
${pantryNames.join(', ') || 'None'}

Respond ONLY with a valid JSON array, no markdown, no code fences. Each object must have:
- "title": recipe name
- "readyInMinutes": estimated total time
- "summary": 1-2 sentence description
- "ingredients": array of ingredient strings needed
- "instructions": step-by-step instructions as a single string
- "missingIngredients": array of ingredients not in my list that would be needed (can be empty)

Sort from quickest to longest. Only suggest recipes where the majority of main ingredients are available.`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      res.status(502).json({ error: `AI service error: ${response.status}` });
      return;
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    const recipes = JSON.parse(cleaned);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get recipe suggestions' });
  }
});

export default router;
