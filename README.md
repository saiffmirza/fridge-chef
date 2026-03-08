# Fridge Chef

A mobile app that suggests recipes based on what's in your fridge and pantry. Powered by Google Gemini AI.

## Features

- **Fridge Management** — Add items with quantity levels (a little / medium / a lot) and track expiry dates with color-coded warnings
- **Pantry Staples** — Keep a list of always-available items (spices, oils, sauces) with stock levels
- **AI Recipe Suggestions** — Get 2-5 recipe ideas based on your ingredients, prioritizing items that expire soon
- **User Accounts** — Register/login with email and password, data synced across devices

## Tech Stack

**Frontend**
- React Native (Expo SDK 55)
- TypeScript
- React Navigation (bottom tabs)
- AsyncStorage

**Backend**
- Node.js / Express 5
- MongoDB (Mongoose)
- JWT authentication (bcryptjs)
- Google Gemini API (gemini-2.0-flash)

## Project Structure

```
fridge-chef/
├── App.tsx                          # Root component with auth + tab navigation
├── src/
│   ├── components/
│   │   └── AddItemInput.tsx         # Reusable input with quantity follow-up
│   ├── screens/
│   │   ├── AuthScreen.tsx           # Login / register
│   │   ├── FridgeScreen.tsx         # Fridge items with expiry tracking
│   │   ├── PantryScreen.tsx         # Pantry staples
│   │   └── RecipesScreen.tsx        # AI recipe suggestions
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
