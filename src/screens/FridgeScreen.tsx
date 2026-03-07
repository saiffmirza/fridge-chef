import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { getFridgeItems, addFridgeItem, updateFridgeItem, deleteFridgeItem } from '../services/api';
import AddItemInput from '../components/AddItemInput';

interface FridgeItemData {
  _id: string;
  name: string;
  expiresAt?: string;
  addedAt: string;
}

export default function FridgeScreen() {
  const [items, setItems] = useState<FridgeItemData[]>([]);

  const load = useCallback(async () => {
    setItems(await getFridgeItems());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (name: string) => {
    const item = await addFridgeItem(name);
    setItems((prev) => [item, ...prev]);
  };

  const setExpiry = (item: FridgeItemData) => {
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
            const updated = await updateFridgeItem(item._id, { expiresAt: d.toISOString() });
            setItems((prev) => prev.map((i) => (i._id === item._id ? updated : i)));
          },
        },
      ],
      'plain-text',
      '',
      'number-pad',
    );
  };

  const removeItem = async (id: string) => {
    await deleteFridgeItem(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
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
      <AddItemInput placeholder="Add item to fridge..." onAdd={handleAdd} />
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item._id}
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
              <TouchableOpacity onPress={() => removeItem(item._id)}>
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
