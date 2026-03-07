import AsyncStorage from '@react-native-async-storage/async-storage';
import { FridgeItem, PantryItem } from '../types';

const FRIDGE_KEY = 'fridge_items';
const PANTRY_KEY = 'pantry_items';

export async function getFridgeItems(): Promise<FridgeItem[]> {
  const data = await AsyncStorage.getItem(FRIDGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveFridgeItems(items: FridgeItem[]): Promise<void> {
  await AsyncStorage.setItem(FRIDGE_KEY, JSON.stringify(items));
}

export async function getPantryItems(): Promise<PantryItem[]> {
  const data = await AsyncStorage.getItem(PANTRY_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePantryItems(items: PantryItem[]): Promise<void> {
  await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
}
