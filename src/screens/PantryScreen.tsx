import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getPantryItems, addPantryItem, deletePantryItem } from '../services/api';
import AddItemInput from '../components/AddItemInput';

interface PantryItemData {
  _id: string;
  name: string;
}

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItemData[]>([]);

  const load = useCallback(async () => {
    setItems(await getPantryItems());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (name: string) => {
    const item = await addPantryItem(name);
    setItems((prev) => [...prev, item]);
  };

  const removeItem = async (id: string) => {
    await deletePantryItem(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  return (
    <View style={styles.container}>
      <AddItemInput placeholder="Add pantry staple (spices, oils, etc.)..." onAdd={handleAdd} />
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeItem(item._id)}>
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
