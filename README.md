# Fridge Chef

<p align="center">
  <img src="./assets/logo.png" alt="fridge, chef." width="320" />
</p>

A mobile app that suggests recipes based on what's in your fridge and pantry. Powered by Google Gemini AI and Groq.

## Features

- **Fridge Management** — Add items with quantity levels (a little / medium / a lot) and track expiry dates with color-coded urgency dots
- **Pantry Staples** — Keep a list of always-available items (spices, oils, sauces) with stock levels (running low / some / plenty)
- **AI Recipe Suggestions** — Get 2–5 recipe ideas based on your ingredients, prioritizing items that expire soon
- **User Accounts** — Register/login with email and password, data synced across devices

## Design

The interface is designed as a "kitchen notebook" — paper-led, type-driven, editorial. Cream paper canvas (`#FAF6EC`), warm ink charcoal text, with terracotta as the primary accent and olive + butter as secondaries. The wordmark uses Fraunces italic; body copy is set in Manrope. Sticker-style chips, hairline rules, and urgency dots stand in for the usual card-and-icon noise. See `.impeccable.md` for the full design context.

## Tech Stack

**Frontend**
- React Native (Expo SDK 55)
- TypeScript
- React Navigation (custom bottom tab bar)
- AsyncStorage
- expo-font + Fraunces / Manrope via `@expo-google-fonts`

**Testing**
- Playwright (headless Chromium, e2e via Expo web)

**Backend**
- Node.js / Express 5
- MongoDB (Mongoose)
- JWT authentication (bcryptjs)
- Google Gemini API (gemini-2.0-flash)

## Project Structure

```
fridge-chef/
├── App.tsx                          # Root: font loading, auth gate, custom tab bar
├── .impeccable.md                   # Design context (audience, brand, principles)
├── tests/
│   └── tests.ts                     # E2E tests (login, fridge, pantry, recipes, logout)
├── assets/
│   ├── logo.png                     # Full wordmark + tomato etching composite
│   ├── icon.png                     # Tomato-only square crop (app icon)
│   ├── splash-icon.png              # Splash screen (cream background)
│   └── favicon.png                  # Web favicon
├── src/
│   ├── theme.ts                     # Colors, type scale, spacing, radii, MAX_CONTENT
│   ├── auth.ts                      # Auth context (logout)
│   ├── components/
│   │   ├── AddItemInput.tsx         # Hairline input + sticker-chip quantity follow-up
│   │   ├── ScreenHeader.tsx         # Eyebrow + italic display title + sign-out
│   │   ├── PaperButton.tsx          # Primary / secondary / ghost button
│   │   └── Chip.tsx                 # Sticker chip (terracotta / olive / butter / ink / ghost)
│   ├── screens/
│   │   ├── AuthScreen.tsx           # Login / register with frontispiece logo
│   │   ├── FridgeScreen.tsx         # Numbered list, urgency dots, inline expiry picker
│   │   ├── PantryScreen.tsx         # Numbered list, sticker chips for stock level
│   │   └── RecipesScreen.tsx        # Editorial recipe entries, expandable details
│   └── services/
│       └── api.ts                   # API client (auth, ingredients, recipes)
├── backend/
│   └── src/
│       ├── server.ts                # Express app + MongoDB connection
│       ├── middleware/
│       │   └── auth.ts              # JWT authentication middleware
│       ├── models/
│       │   ├── User.ts              # User model with password hashing
│       │   ├── FridgeItem.ts        # Fridge item model (name, expiresAt)
│       │   └── PantryItem.ts        # Pantry item model (name)
│       └── routes/
│           ├── auth.ts              # Register / login endpoints
│           ├── ingredients.ts       # CRUD for fridge + pantry items
│           └── recipes.ts           # AI recipe generation with guardrails
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Google Gemini API key

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
MONGODB_URI=mongodb://localhost:27017/fridge-chef
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
PORT=3000
```

Start the server:

```bash
npm run dev
```

### Frontend Setup

```bash
# From the project root
npm install
```

Optionally set the API URL (defaults to `http://localhost:3000`):

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Start the app:

```bash
npx expo start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/ingredients/fridge` | List fridge items |
| POST | `/api/ingredients/fridge` | Add fridge item |
| PATCH | `/api/ingredients/fridge/:id` | Update fridge item |
| DELETE | `/api/ingredients/fridge/:id` | Delete fridge item |
| GET | `/api/ingredients/pantry` | List pantry items |
| POST | `/api/ingredients/pantry` | Add pantry item |
| DELETE | `/api/ingredients/pantry/:id` | Delete pantry item |
| POST | `/api/recipes/suggestions` | Get AI recipe suggestions |

All endpoints except auth require a `Bearer` token in the `Authorization` header.

## Testing

E2E tests use Playwright running against the Expo web build. Tests are in `tests/tests.ts`.

```bash
# 1. Start the backend
cd backend && npm run dev

# 2. Start the frontend (in another terminal)
npx expo start --web --port 8082

# 3. Run tests (in another terminal)
npx tsx tests/tests.ts
```
