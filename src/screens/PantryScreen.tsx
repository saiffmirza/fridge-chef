import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { addPantryItem, deletePantryItem, getPantryItems } from '../services/api';
import AddItemInput from '../components/AddItemInput';
import ScreenHeader from '../components/ScreenHeader';
import Chip from '../components/Chip';
import { colors, FONT, MAX_CONTENT, type as type_, webOnly } from '../theme';

interface PantryItemData {
  _id: string;
  name: string;
}

function parseQuantity(raw: string): { name: string; qty?: string } {
  const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { name: raw };
  return { name: m[1].trim(), qty: m[2].trim() };
}

function chipTone(qty?: string): 'olive' | 'butter' | 'terracotta' | 'ghost' {
  if (!qty) return 'ghost';
  const q = qty.toLowerCase();
  if (q.includes('plenty')) return 'olive';
  if (q.includes('some')) return 'butter';
  if (q.includes('low')) return 'terracotta';
  return 'ghost';
}

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItemData[]>([]);
  const fade = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setItems(await getPantryItems());
    Animated.timing(fade, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

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

  const hint =
    items.length === 0
      ? 'the long-life things. spices, oils, sauces, the rice you always have.'
      : `${items.length} ${items.length === 1 ? 'staple' : 'staples'} on the shelf.`;

  return (
    <View style={s.root}>
      <View style={s.frame}>
      <ScreenHeader kicker="The Pantry" title="always here." italic hint={hint} />

      <AddItemInput placeholder="olive oil, flaky salt, soy sauce…" onAdd={handleAdd} mode="pantry" />

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={s.divider} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTitle}>An empty shelf.</Text>
              <Text style={s.emptyBody}>
                Pantry staples are the things you keep. They don't show up in the fridge list, but
                they quietly join every recipe suggestion. <Text style={s.emptyAccent}>add the basics first.</Text>
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const { name, qty } = parseQuantity(item.name);
            const tone = chipTone(qty);
            const num = String(index + 1).padStart(2, '0');
            return (
              <View style={s.row}>
                <Text style={s.num}>{num}</Text>
                <View style={s.middle}>
                  <Text style={s.name}>{name}</Text>
                </View>
                {qty && <Chip label={qty} tone={tone} style={s.chip} />}
                <TouchableOpacity
                  onPress={() => removeItem(item._id)}
                  hitSlop={12}
                  style={[s.removeBtn, webOnly({ cursor: 'pointer' })]}
                >
                  <Text style={s.removeTxt}>×</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: MAX_CONTENT },
  list: { paddingBottom: 36 },
  divider: { height: 1, backgroundColor: colors.hairlineSoft, marginHorizontal: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    gap: 12,
  },
  num: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    width: 26,
  },
  middle: { flex: 1 },
  name: { ...type_.titleItalic, color: colors.ink },
  chip: {},
  removeBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTxt: {
    fontFamily: FONT.serif,
    fontSize: 22,
    color: colors.inkFaint,
    lineHeight: 22,
  },

  empty: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  emptyTitle: { ...type_.titleItalic, color: colors.inkSoft },
  emptyBody: {
    ...type_.bodyL,
    color: colors.inkSoft,
    marginTop: 10,
    maxWidth: 380,
  },
  emptyAccent: {
    fontFamily: FONT.serifItalic,
    color: colors.olive,
  },
});
