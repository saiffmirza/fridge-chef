import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addFridgeItem,
  deleteFridgeItem,
  estimateExpiry,
  getFridgeItems,
  updateFridgeItem,
} from '../services/api';
import BulkAddModal, { FridgeBulkResult } from '../components/BulkAddModal';
import EditModal from '../components/EditModal';
import PaperButton from '../components/PaperButton';
import ScreenHeader from '../components/ScreenHeader';
import { colors, FONT, MAX_CONTENT, radii, type as type_, webOnly } from '../theme';

interface FridgeItemData {
  _id: string;
  name: string;
  expiresAt?: string;
  addedAt: string;
}

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

function daysFromNow(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function FridgeScreen() {
  const [items, setItems] = useState<FridgeItemData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setItems(await getFridgeItems());
    Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBulkConfirm = async (entries: FridgeBulkResult[]) => {
    setSaving(true);
    setError(null);
    try {
      const estimates = await estimateExpiry(
        entries.map((e) => ({ name: e.name, daysAgo: e.daysAgo, context: e.context })),
      );
      const byName = new Map(estimates.map((est) => [est.name, est.daysUntilExpiry]));

      const created: FridgeItemData[] = [];
      for (const entry of entries) {
        const days = byName.get(entry.name) ?? 5;
        const expiresAt = daysFromNow(days);
        const item = await addFridgeItem(entry.name, expiresAt);
        created.push(item);
      }
      setItems((prev) => [...created.reverse(), ...prev]);
      setModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not add items. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const renameItem = async (id: string, newName: string) => {
    const current = items.find((i) => i._id === id);
    if (!current) return;
    const { qty } = parseQuantity(current.name);
    const merged = qty ? `${newName} (${qty})` : newName;
    const updated = await updateFridgeItem(id, { name: merged });
    setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
  };

  const setExpiryDate = async (id: string, date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const updated = await updateFridgeItem(id, { expiresAt: d.toISOString() });
    setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
    setEditingId(null);
  };

  const clearExpiry = async (id: string) => {
    const updated = await updateFridgeItem(id, { expiresAt: undefined });
    setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
    setEditingId(null);
  };

  const removeItem = async (id: string) => {
    await deleteFridgeItem(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
    if (editingId === id) setEditingId(null);
  };

  const editingItem = items.find((i) => i._id === editingId) ?? null;

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

        <View style={s.ctaRow}>
          <PaperButton
            label="add to fridge"
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
            data={sorted}
            keyExtractor={(item) => item._id}
            contentContainerStyle={s.list}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={s.divider} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyTxt}>
                  Empty shelves.{'\n'}
                  <Text style={s.emptyTxtItalic}>tap "add to fridge" above to begin.</Text>
                </Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const { name, qty } = parseQuantity(item.name);
              const status = expiryStatus(item.expiresAt);
              const isExpired = status.tone === 'expired';
              const num = String(index + 1).padStart(2, '0');
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setEditingId(item._id)}
                  style={[s.row, isExpired && s.rowExpired, webOnly({ cursor: 'pointer' })]}
                >
                  <Text style={s.num}>{num}</Text>
                  <View style={[s.dot, { backgroundColor: toneColor[status.tone] }]} />
                  <View style={s.middle}>
                    <Text style={[s.name, isExpired && s.nameExpired]}>{name}</Text>
                    {qty && <Text style={s.qty}>{qty}</Text>}
                  </View>
                  <View style={s.right}>
                    <Text
                      style={[
                        s.expiry,
                        { color: toneColor[status.tone] },
                        isExpired && s.expiredLabel,
                      ]}
                    >
                      {isExpired ? 'expired' : status.label}
                    </Text>
                    {isExpired ? (
                      <TouchableOpacity
                        onPress={() => removeItem(item._id)}
                        hitSlop={8}
                        activeOpacity={0.85}
                        style={[s.deleteBtn, webOnly({ cursor: 'pointer' })]}
                      >
                        <Text style={s.deleteBtnTxt}>delete</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={s.openHint}>edit</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </View>

      <BulkAddModal
        visible={modalOpen}
        mode="fridge"
        saving={saving}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setError(null);
          }
        }}
        onConfirm={handleBulkConfirm}
      />

      <EditModal
        visible={!!editingItem}
        itemName={editingItem ? parseQuantity(editingItem.name).name : ''}
        value={editingItem?.expiresAt ? new Date(editingItem.expiresAt) : undefined}
        onRename={(newName) => editingItem && renameItem(editingItem._id, newName)}
        onSelect={(d) => editingItem && setExpiryDate(editingItem._id, d)}
        onClear={
          editingItem?.expiresAt ? () => clearExpiry(editingItem._id) : undefined
        }
        onRemove={() => editingItem && removeItem(editingItem._id)}
        onClose={() => setEditingId(null)}
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

  rowExpired: {
    backgroundColor: colors.terracottaTint,
  },
  nameExpired: {
    textDecorationLine: 'line-through',
    color: colors.inkSoft,
  },
  expiredLabel: {
    fontFamily: FONT.sansSemi,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  deleteBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.chip,
    backgroundColor: colors.terracotta,
  },
  deleteBtnTxt: {
    fontFamily: FONT.sansSemi,
    fontSize: 11,
    letterSpacing: 0.4,
    color: colors.paper,
    textTransform: 'lowercase',
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
