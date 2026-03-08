import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

type QuantityOption = { label: string; value: string };

const FRIDGE_QUANTITIES: QuantityOption[] = [
  { label: 'A Little', value: 'a little' },
  { label: 'Medium', value: 'medium amount' },
  { label: 'A Lot', value: 'a lot' },
];

const PANTRY_QUANTITIES: QuantityOption[] = [
  { label: 'Running Low', value: 'running low' },
  { label: 'Some', value: 'some' },
  { label: 'Plenty', value: 'plenty' },
];

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface Props {
  placeholder: string;
  onAdd: (name: string) => void;
  mode: 'fridge' | 'pantry';
}

export default function AddItemInput({ placeholder, onAdd, mode }: Props) {
  const [text, setText] = useState('');
  const [pendingItem, setPendingItem] = useState<string | null>(null);

  const quantities = mode === 'fridge' ? FRIDGE_QUANTITIES : PANTRY_QUANTITIES;
  const question = mode === 'fridge' ? 'How much do you have?' : 'How stocked are you?';

  const handleAdd = () => {
    const trimmed = text.trim();
    if (trimmed) {
      setPendingItem(trimmed);
      setText('');
    }
  };

  const handleQuantitySelect = (quantity: string) => {
    if (pendingItem) {
      const formatted = `${capitalize(pendingItem)} (${quantity})`;
      onAdd(formatted);
      setPendingItem(null);
    }
  };

  const handleCancel = () => {
    setPendingItem(null);
  };

  if (pendingItem) {
    return (
      <View style={styles.followUp}>
        <Text style={styles.question}>
          {question} <Text style={styles.itemHighlight}>{capitalize(pendingItem)}</Text>
        </Text>
        <View style={styles.optionsRow}>
          {quantities.map((q) => (
            <TouchableOpacity
              key={q.value}
              style={styles.optionButton}
              onPress={() => handleQuantitySelect(q.value)}
            >
              <Text style={styles.optionText}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followUp: {
    padding: 14,
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  question: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  itemHighlight: {
    fontWeight: '700',
    color: '#4CAF50',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelText: {
    color: '#888',
    fontSize: 14,
  },
});
