import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { PantryItem } from '../types';
import { getPantryItems, savePantryItems } from '../storage/storage';
import AddItemInput from '../components/AddItemInput';

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItem[]>([]);

  const load = useCallback(async () => {
    setItems(await getPantryItems());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async (name: string) => {
    const newItem: PantryItem = {
      id: Date.now().toString(),
      name,
    };
    const updated = [...items, newItem];
    setItems(updated);
    await savePantryItems(updated);
  };

  const removeItem = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    await savePantryItems(updated);
  };

  return (
    <View style={styles.container}>
      <AddItemInput placeholder="Add pantry staple (spices, oils, etc.)..." onAdd={addItem} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Text style={styles.remove}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Add your pantry staples here — spices, oils, sauces, and other items that don't expire.
          </Text>
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
    justifyContent: 'space-between',
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
  itemName: { fontSize: 16, fontWeight: '500' },
  remove: { fontSize: 18, color: '#f44336', fontWeight: 'bold', paddingLeft: 12 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15, paddingHorizontal: 20 },
});
