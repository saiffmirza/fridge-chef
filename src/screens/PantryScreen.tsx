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
import BulkAddModal from '../components/BulkAddModal';
import PaperButton from '../components/PaperButton';
import ScreenHeader from '../components/ScreenHeader';
import { colors, FONT, MAX_CONTENT, type as type_, webOnly } from '../theme';

interface PantryItemData {
  _id: string;
  name: string;
}

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItemData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleBulkConfirm = async (entries: { name: string }[]) => {
    setSaving(true);
    setError(null);
    try {
      const created: PantryItemData[] = [];
      for (const entry of entries) {
        const item = await addPantryItem(entry.name);
        created.push(item);
      }
      setItems((prev) => [...prev, ...created]);
      setModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not add items. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
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

        <View style={s.ctaRow}>
          <PaperButton
            label="add to pantry"
            trailing="→"
            onPress={() => setModalOpen(true)}
            full
          />
        </View>

        {error && (
          <View style={s.errorRow}>
            <Text style={s.errorTxt}>{error}</Text>
          </View>
        )}

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
                  they quietly join every recipe suggestion.{' '}
                  <Text style={s.emptyAccent}>add the basics first.</Text>
                </Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const num = String(index + 1).padStart(2, '0');
              return (
                <View style={s.row}>
                  <Text style={s.num}>{num}</Text>
                  <View style={s.middle}>
                    <Text style={s.name}>{item.name}</Text>
                  </View>
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

      <BulkAddModal
        visible={modalOpen}
        mode="pantry"
        saving={saving}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setError(null);
          }
        }}
        onConfirm={handleBulkConfirm}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: MAX_CONTENT },
  ctaRow: {
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 18,
  },
  errorRow: { paddingHorizontal: 28, paddingBottom: 12 },
  errorTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.expired,
  },
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
