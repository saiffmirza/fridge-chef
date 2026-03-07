import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export async function register(email: string, password: string) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await AsyncStorage.setItem('auth_token', data.token);
  return data;
}

export async function login(email: string, password: string) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await AsyncStorage.setItem('auth_token', data.token);
  return data;
}

export async function logout() {
  await AsyncStorage.removeItem('auth_token');
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

// Fridge
export async function getFridgeItems() {
  return request('/api/ingredients/fridge');
}

export async function addFridgeItem(name: string, expiresAt?: string) {
  return request('/api/ingredients/fridge', {
    method: 'POST',
    body: JSON.stringify({ name, expiresAt }),
  });
}

export async function updateFridgeItem(id: string, updates: { expiresAt?: string }) {
  return request(`/api/ingredients/fridge/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteFridgeItem(id: string) {
  return request(`/api/ingredients/fridge/${id}`, { method: 'DELETE' });
}

// Pantry
export async function getPantryItems() {
  return request('/api/ingredients/pantry');
}

export async function addPantryItem(name: string) {
  return request('/api/ingredients/pantry', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deletePantryItem(id: string) {
  return request(`/api/ingredients/pantry/${id}`, { method: 'DELETE' });
}

// Recipes
export async function getRecipeSuggestions() {
  return request('/api/recipes/suggestions', { method: 'POST' });
}
