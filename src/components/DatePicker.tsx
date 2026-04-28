import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, FONT, radii, type as type_, webOnly } from '../theme';

interface Props {
  value?: Date;
  onSelect: (date: Date) => void;
  onClear?: () => void;
  onCancel?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['s', 'm', 't', 'w', 't', 'f', 's'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DatePicker({ value, onSelect, onClear, onCancel }: Props) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [cursor, setCursor] = useState(() => startOfMonth(value ?? today));

  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <TouchableOpacity onPress={goPrev} hitSlop={10} style={[s.navBtn, webOnly({ cursor: 'pointer' })]}>
          <Text style={s.navTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.monthTxt}>
            {MONTHS[cursor.getMonth()]} <Text style={s.yearTxt}>{cursor.getFullYear()}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={goNext} hitSlop={10} style={[s.navBtn, webOnly({ cursor: 'pointer' })]}>
          <Text style={s.navTxt}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={s.weekday}>{d}</Text>
        ))}
      </View>

      <View style={s.grid}>
        {grid.map((cell, i) => {
          if (!cell) return <View key={i} style={s.cell} />;
          const isToday = isSameDay(cell, today);
          const isSelected = value ? isSameDay(cell, value) : false;
          const isPast = cell.getTime() < today.getTime();
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.75}
              onPress={() => onSelect(cell)}
              style={[s.cell, webOnly({ cursor: 'pointer' })]}
            >
              <View
                style={[
                  s.cellInner,
                  isSelected && s.cellSelected,
                  !isSelected && isToday && s.cellToday,
                ]}
              >
                <Text
                  style={[
                    s.cellTxt,
                    isPast && !isSelected && s.cellTxtPast,
                    isSelected && s.cellTxtSelected,
                  ]}
                >
                  {cell.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.footer}>
        {onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={10} style={webOnly({ cursor: 'pointer' })}>
            <Text style={s.linkTxt}>clear date</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <View style={{ flex: 1 }} />
        {onCancel && (
          <TouchableOpacity onPress={onCancel} hitSlop={10} style={webOnly({ cursor: 'pointer' })}>
            <Text style={s.linkTxt}>nevermind</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  monthTxt: {
    ...type_.titleItalic,
    fontSize: 18,
    color: colors.ink,
  },
  yearTxt: {
    fontFamily: FONT.serif,
    color: colors.inkSoft,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  navTxt: {
    fontFamily: FONT.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24,
    marginTop: -2,
  },
  weekRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.sansSemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.inkFaint,
    textTransform: 'lowercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  cellInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  cellSelected: {
    backgroundColor: colors.terracotta,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cellTxt: {
    fontFamily: FONT.sansMed,
    fontSize: 14,
    color: colors.ink,
  },
  cellTxtPast: { color: colors.inkFaint },
  cellTxtSelected: {
    color: colors.paper,
    fontFamily: FONT.sansSemi,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineSoft,
  },
  linkTxt: {
    fontFamily: FONT.serifItalic,
    fontSize: 13,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
});
