// src/screens/TranslatorScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { translateText, healthCheck } from '../services/TranslatorApi';

const LANGUAGES = [
  { label: '🇬🇧 English', value: 'English' },
  { label: '🇫🇷 French',  value: 'French'  },
  { label: '🇪🇸 Spanish', value: 'Spanish' },
  { label: '🇸🇦 Arabic',  value: 'Arabic'  },
  { label: '🇩🇪 German',  value: 'German'  },
];

export default function TranslatorScreen() {
  const [inputText,    setInputText]    = useState('');
  const [translated,   setTranslated]   = useState('');
  const [sourceLang,   setSourceLang]   = useState('English');
  const [loading,      setLoading]      = useState(false);
  const [serviceUp,    setServiceUp]    = useState(null);
  const [speaking,     setSpeaking]     = useState(false);

  // Health check on mount
  useEffect(() => {
    healthCheck().then(setServiceUp);
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      Alert.alert('Empty Input', 'Please enter text to translate.');
      return;
    }
    setLoading(true);
    setTranslated('');
    try {
      const result = await translateText(inputText.trim(), sourceLang);
      if (result.success) {
        setTranslated(result.translatedText);
      } else {
        Alert.alert('Translation Error', result.errorMessage || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Connection Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [inputText, sourceLang]);

  const handleSpeak = useCallback(() => {
    if (!translated) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    Speech.speak(translated, {
      language: 'ar-MA',
      rate: 0.9,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(true);
  }, [translated, speaking]);

  const handleCopy = useCallback(async () => {
    if (!translated) return;
    await Clipboard.setStringAsync(translated);
    Alert.alert('Copied!', 'Translation copied to clipboard.');
  }, [translated]);

  const handleClear = useCallback(() => {
    setInputText('');
    setTranslated('');
    setSpeaking(false);
    Speech.stop();
  }, []);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🇲🇦 Darija Translator</Text>
        <Text style={styles.headerSub}>Powered by Google Gemini AI</Text>
        <View style={[styles.badge, serviceUp === null ? styles.badgeNeutral : serviceUp ? styles.badgeUp : styles.badgeDown]}>
          <Text style={styles.badgeText}>
            {serviceUp === null ? 'Checking…' : serviceUp ? '● Service UP' : '● Service DOWN'}
          </Text>
        </View>
      </View>

      {/* Language Picker */}
      <View style={styles.card}>
        <Text style={styles.label}>Source Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langRow}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.value}
              style={[styles.langChip, sourceLang === lang.value && styles.langChipActive]}
              onPress={() => setSourceLang(lang.value)}
            >
              <Text style={[styles.langChipText, sourceLang === lang.value && styles.langChipTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={styles.card}>
        <Text style={styles.label}>Text to Translate</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Type or paste text here…"
          placeholderTextColor="#aaa"
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="top"
        />
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleTranslate} disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnPrimaryText}>Translate ترجم</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleClear}>
            <Text style={styles.btnSecondaryText}>Clear ✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Output */}
      {translated ? (
        <View style={styles.card}>
          <Text style={styles.label}>🇲🇦 Darija Translation</Text>
          <View style={styles.outputBox}>
            <Text style={styles.outputText}>{translated}</Text>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSpeak} onPress={handleSpeak}>
              <Text style={styles.btnPrimaryText}>{speaking ? '⏸ Stop' : '🔊 Read'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleCopy}>
              <Text style={styles.btnSecondaryText}>Copy نسخ</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const RED   = '#c1272d';
const GREEN = '#006233';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },

  header: {
    backgroundColor: RED, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center',
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '700' },
  headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  badge:       { marginTop: 10, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  badgeNeutral:{ backgroundColor: '#eee' },
  badgeUp:     { backgroundColor: '#d4edda' },
  badgeDown:   { backgroundColor: '#f8d7da' },
  badgeText:   { fontSize: 12, fontWeight: '600', color: '#333' },

  card: {
    backgroundColor: 'white', borderRadius: 12, margin: 12, marginBottom: 0,
    padding: 14, shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },

  langRow: { flexDirection: 'row' },
  langChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#dde1e7', marginRight: 8,
  },
  langChipActive:     { backgroundColor: RED, borderColor: RED },
  langChipText:       { fontSize: 13, color: '#555' },
  langChipTextActive: { color: 'white', fontWeight: '600' },

  textInput: {
    minHeight: 100, borderWidth: 1.5, borderColor: '#dde1e7', borderRadius: 8,
    padding: 10, fontSize: 15, color: '#1a1a2e',
  },

  btnRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  btnPrimary: {
    flex: 1, backgroundColor: RED, paddingVertical: 11,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText:  { color: 'white', fontWeight: '700', fontSize: 14 },
  btnSecondary: {
    flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 11,
    borderRadius: 8, alignItems: 'center',
  },
  btnSecondaryText: { color: '#555', fontWeight: '600', fontSize: 14 },
  btnSpeak: {
    flex: 1, backgroundColor: GREEN, paddingVertical: 11,
    borderRadius: 8, alignItems: 'center',
  },

  outputBox: {
    backgroundColor: '#f8f9fa', borderWidth: 1.5, borderColor: '#dde1e7',
    borderRadius: 8, padding: 12, minHeight: 80,
  },
  outputText: { fontSize: 18, color: '#1a1a2e', textAlign: 'right', lineHeight: 30 },
});
