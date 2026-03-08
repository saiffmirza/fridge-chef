import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { AiProvider, getAiSettings, saveAiSettings, resetAiSettings } from '../services/api';

const PROVIDERS: { value: AiProvider; label: string; description: string; keyLabel: string; keyUrl: string }[] = [
  {
    value: 'gemini',
    label: 'Gemini (Default)',
    description: "Uses the app's built-in Gemini connection. No API key needed.",
    keyLabel: '',
    keyUrl: '',
  },
  {
    value: 'claude',
    label: 'Claude (Anthropic)',
    description: 'Use your own Anthropic API key. Get one at console.anthropic.com.',
    keyLabel: 'Anthropic API Key',
    keyUrl: 'console.anthropic.com',
  },
  {
    value: 'openai',
    label: 'OpenAI (ChatGPT)',
    description: 'Use your own OpenAI API key. Get one at platform.openai.com.',
    keyLabel: 'OpenAI API Key',
    keyUrl: 'platform.openai.com',
  },
];

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AiProvider>('gemini');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await getAiSettings();
      setSelectedProvider(settings.aiProvider);
      setActiveProvider(settings.aiProvider);
      setHasStoredKey(settings.hasApiKey);
    } catch {
      Alert.alert('Error', 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (selectedProvider !== 'gemini' && !apiKey.trim() && !hasStoredKey) {
      Alert.alert('API Key Required', 'Please enter your API key for this provider.');
      return;
    }

    setSaving(true);
    try {
      const keyToSend = apiKey.trim() || undefined;
      await saveAiSettings(selectedProvider, keyToSend);
      setActiveProvider(selectedProvider);
      setHasStoredKey(selectedProvider !== 'gemini' ? true : false);
      setApiKey('');
      Alert.alert('Saved', 'Your AI settings have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    Alert.alert('Reset AI Provider', 'Switch back to the default Gemini AI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await resetAiSettings();
            setSelectedProvider('gemini');
            setActiveProvider('gemini');
            setHasStoredKey(false);
            setApiKey('');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reset settings.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  const currentProviderInfo = PROVIDERS.find((p) => p.value === selectedProvider)!;
  const isDirty =
    selectedProvider !== activeProvider || (apiKey.trim().length > 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>AI Provider</Text>
      <Text style={styles.sectionSubtitle}>
        Connect your own AI subscription for recipe suggestions.
      </Text>

      {PROVIDERS.map((provider) => {
        const isSelected = selectedProvider === provider.value;
        const isActive = activeProvider === provider.value;
        return (
          <TouchableOpacity
            key={provider.value}
            style={[styles.providerCard, isSelected && styles.providerCardSelected]}
            onPress={() => {
              setSelectedProvider(provider.value);
              setApiKey('');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.providerRow}>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <View style={styles.providerTextWrap}>
                <View style={styles.providerLabelRow}>
                  <Text style={[styles.providerLabel, isSelected && styles.providerLabelSelected]}>
                    {provider.label}
                  </Text>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.providerDescription}>{provider.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {selectedProvider !== 'gemini' && (
        <View style={styles.keySection}>
          <Text style={styles.keyLabel}>{currentProviderInfo.keyLabel}</Text>
          {hasStoredKey && activeProvider === selectedProvider && (
            <Text style={styles.keyStoredNote}>
              A key is already saved. Enter a new one below to replace it.
            </Text>
          )}
          <TextInput
            style={styles.keyInput}
            placeholder={
              hasStoredKey && activeProvider === selectedProvider
                ? 'Enter new key to replace...'
                : 'Paste your API key here...'
            }
            placeholderTextColor="#aaa"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.keyHint}>
            Your key is encrypted and stored securely. It is never shared.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, (!isDirty || saving) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isDirty || saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>

      {activeProvider !== 'gemini' && (
        <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={saving}>
          <Text style={styles.resetButtonText}>Reset to Default (Gemini)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  providerCardSelected: {
    borderColor: '#4CAF50',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#4CAF50',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  providerTextWrap: {
    flex: 1,
  },
  providerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  providerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  providerLabelSelected: {
    color: '#4CAF50',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  providerDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  keySection: {
    marginTop: 8,
    marginBottom: 4,
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  keyStoredNote: {
    fontSize: 13,
    color: '#4CAF50',
    marginBottom: 6,
  },
  keyInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#222',
    marginBottom: 6,
  },
  keyHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  resetButtonText: {
    color: '#e53935',
    fontSize: 14,
  },
});
