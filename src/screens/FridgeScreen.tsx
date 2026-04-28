import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addFridgeItem,
  deleteFridgeItem,
  getFridgeItems,
  updateFridgeItem,
} from '../services/api';
import AddItemInput from '../components/AddItemInput';
import ScreenHeader from '../components/ScreenHeader';
import { colors, FONT, MAX_CONTENT, radii, type as type_, webOnly } from '../theme';

interface FridgeItemData {
  _id: string;
  name: string;
  expiresAt?: string;
  addedAt: string;
}

const QUICK_PICKS: { label: string; days: number }[] = [
  { label: 'today', days: 0 },
  { label: 'tomorrow', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
];

function parseQuantity(raw: string): { name: string; qty?: string } {
  const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { name: raw };
  return { name: m[1].trim(), qty: m[2].trim() };
}

function expiryStatus(expiresAt?: string): {
  label: string;
  tone: 'fresh' | 'soon' | 'urgent' | 'expired' | 'none';
} {
  if (!expiresAt) return { label: 'no date', tone: 'none' };
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'past', tone: 'expired' };
  if (days === 0) return { label: 'today', tone: 'urgent' };
  if (days === 1) return { label: 'tomorrow', tone: 'urgent' };
  if (days <= 3) return { label: `${days} days`, tone: 'soon' };
  return { label: `${days} days`, tone: 'fresh' };
}

const toneColor = {
  fresh: colors.fresh,
  soon: colors.warning,
  urgent: colors.terracotta,
  expired: colors.expired,
  none: colors.inkFaint,
} as const;

export default function FridgeScreen() {
  const [items, setItems] = useState<FridgeItemData[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setItems(await getFridgeItems());
    Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (name: string) => {
    const item = await addFridgeItem(name);
    setItems((prev) => [item, ...prev]);
  };

  const setExpiryDays = async (id: string, days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const updated = await updateFridgeItem(id, { expiresAt: d.toISOString() });
    setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
    setOpenId(null);
  };

  const clearExpiry = async (id: string) => {
    const updated = await updateFridgeItem(id, { expiresAt: undefined });
    setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
    setOpenId(null);
  };

  const removeItem = async (id: string) => {
    await deleteFridgeItem(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
    if (openId === id) setOpenId(null);
  };

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }),
    [items],
  );

  const counts = useMemo(() => {
    let urgent = 0;
    items.forEach((i) => {
      const t = expiryStatus(i.expiresAt).tone;
      if (t === 'urgent' || t === 'expired') urgent += 1;
    });
    return { total: items.length, urgent };
  }, [items]);

  const hint =
    counts.total === 0
      ? 'a notebook for what is here, what is leaving soon, what to use first.'
      : counts.urgent > 0
        ? `${counts.urgent} ${counts.urgent === 1 ? 'thing wants' : 'things want'} cooking soon.`
        : `${counts.total} ${counts.total === 1 ? 'thing' : 'things'} on hand. nothing urgent.`;

  return (
    <View style={s.root}>
      <View style={s.frame}>
      <ScreenHeader kicker="The Fridge" title="what's in." italic hint={hint} />

      <AddItemInput placeholder="tomatoes, basil, half a lemon…" onAdd={handleAdd} mode="fridge" />

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <FlatList
          data={sorted}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={s.divider} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTxt}>
                Empty shelves.{'\n'}
                <Text style={s.emptyTxtItalic}>add a few things from above to begin.</Text>
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const { name, qty } = parseQuantity(item.name);
            const status = expiryStatus(item.expiresAt);
            const isOpen = openId === item._id;
            const num = String(index + 1).padStart(2, '0');
            return (
              <View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setOpenId(isOpen ? null : item._id)}
                  style={[s.row, webOnly({ cursor: 'pointer' })]}
                >
                  <Text style={s.num}>{num}</Text>
                  <View style={[s.dot, { backgroundColor: toneColor[status.tone] }]} />
                  <View style={s.middle}>
                    <Text style={s.name}>{name}</Text>
                    {qty && <Text style={s.qty}>{qty}</Text>}
                  </View>
                  <View style={s.right}>
                    <Text style={[s.expiry, { color: toneColor[status.tone] }]}>
                      {status.label}
                    </Text>
                    <Text style={s.openHint}>{isOpen ? 'close' : 'edit'}</Text>
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={s.picker}>
                    <Text style={s.pickerLabel}>expires in</Text>
                    <View style={s.pickerChips}>
                      {QUICK_PICKS.map((p) => (
                        <TouchableOpacity
                          key={p.label}
                          onPress={() => setExpiryDays(item._id, p.days)}
                          activeOpacity={0.85}
                          style={[s.pickChip, webOnly({ cursor: 'pointer' })]}
                        >
                          <Text style={s.pickChipTxt}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={s.pickerActions}>
                      {item.expiresAt && (
                        <TouchableOpacity
                          onPress={() => clearExpiry(item._id)}
                          hitSlop={10}
                          style={webOnly({ cursor: 'pointer' })}
                        >
                          <Text style={s.linkTxt}>clear date</Text>
                        </TouchableOpacity>
                      )}
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity
                        onPress={() => removeItem(item._id)}
                        hitSlop={10}
                        style={webOnly({ cursor: 'pointer' })}
                      >
                        <Text style={[s.linkTxt, { color: colors.expired }]}>
                          remove from fridge
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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
  },
  num: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkFaint,
    width: 26,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 14,
  },
  middle: { flex: 1, paddingRight: 12 },
  name: {
    ...type_.titleItalic,
    color: colors.ink,
  },
  qty: {
    fontFamily: FONT.sans,
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  right: { alignItems: 'flex-end' },
  expiry: {
    fontFamily: FONT.sansSemi,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  openHint: {
    fontFamily: FONT.serifItalic,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
  },

  picker: {
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 22,
    backgroundColor: colors.paperWarm,
  },
  pickerLabel: {
    ...type_.eyebrow,
    color: colors.inkSoft,
    marginBottom: 10,
    marginTop: 14,
  },
  pickerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pickChipTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 13,
    color: colors.ink,
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },
  pickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  linkTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },

  empty: {
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  emptyTxt: {
    ...type_.title,
    color: colors.inkSoft,
  },
  emptyTxtItalic: {
    fontFamily: FONT.serifItalic,
    color: colors.inkFaint,
    fontSize: 18,
    lineHeight: 28,
  },
});
