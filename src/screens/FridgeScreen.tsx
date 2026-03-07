import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { FridgeItem } from '../types';
import { getFridgeItems, saveFridgeItems } from '../storage/storage';
import AddItemInput from '../components/AddItemInput';

export default function FridgeScreen() {
  const [items, setItems] = useState<FridgeItem[]>([]);

  const load = useCallback(async () => {
    setItems(await getFridgeItems());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async (name: string) => {
    const newItem: FridgeItem = {
      id: Date.now().toString(),
      name,
      addedAt: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    setItems(updated);
    await saveFridgeItems(updated);
  };

  const setExpiry = (item: FridgeItem) => {
    Alert.prompt(
      'Set Expiry',
      `Days until ${item.name} expires:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: async (days?: string) => {
            if (!days) return;
            const d = new Date();
            d.setDate(d.getDate() + parseInt(days, 10));
            const updated = items.map((i) =>
              i.id === item.id ? { ...i, expiresAt: d.toISOString() } : i,
            );
            setItems(updated);
            await saveFridgeItems(updated);
          },
        },
      ],
      'plain-text',
      '',
      'number-pad',
    );
  };

  const removeItem = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    await saveFridgeItems(updated);
  };

  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryColor = (days: number | null) => {
    if (days === null) return '#888';
    if (days <= 1) return '#f44336';
    if (days <= 3) return '#FF9800';
    return '#4CAF50';
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!a.expiresAt && !b.expiresAt) return 0;
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });

  return (
    <View style={styles.container}>
      <AddItemInput placeholder="Add item to fridge..." onAdd={addItem} />
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const days = getDaysUntilExpiry(item.expiresAt);
          return (
            <View style={styles.item}>
              <TouchableOpacity style={styles.itemContent} onPress={() => setExpiry(item)}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={[styles.expiry, { color: getExpiryColor(days) }]}>
                  {days !== null
                    ? days <= 0
                      ? 'Expired!'
                      : `${days}d left`
                    : 'Tap to set expiry'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Text style={styles.remove}>X</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No items in your fridge. Add some above!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemContent: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '500' },
  expiry: { fontSize: 13, marginTop: 4 },
  remove: { fontSize: 18, color: '#f44336', fontWeight: 'bold', paddingLeft: 12 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});
