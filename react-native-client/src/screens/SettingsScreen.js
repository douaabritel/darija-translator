// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setConfig } from '../services/TranslatorApi';

const KEYS = { SERVER: 'server_url', USER: 'username', PASS: 'password' };

export default function SettingsScreen() {
  const [server,   setServer]   = useState('http://10.0.2.2:8080/darija-translator/api/translator');
  const [username, setUsername] = useState('translator-user');
  const [password, setPassword] = useState('');
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    (async () => {
      const sv = await AsyncStorage.getItem(KEYS.SERVER);
      const us = await AsyncStorage.getItem(KEYS.USER);
      const pw = await AsyncStorage.getItem(KEYS.PASS);
      if (sv) setServer(sv);
      if (us) setUsername(us);
      if (pw) setPassword(pw);
      if (sv || us || pw) setConfig({ baseUrl: sv, username: us, password: pw });
    })();
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem(KEYS.SERVER, server);
    await AsyncStorage.setItem(KEYS.USER,   username);
    await AsyncStorage.setItem(KEYS.PASS,   password);
    setConfig({ baseUrl: server, username, password });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Alert.alert('Saved', 'Settings saved successfully.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <Text style={styles.headerSub}>Configure server and credentials</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={server}
          onChangeText={setServer}
          placeholder="http://192.168.1.100:8080/..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.hint}>
          Android emulator: 10.0.2.2{'\n'}
          iOS simulator: localhost{'\n'}
          Physical device: your machine's local IP
        </Text>

        <Text style={[styles.label, { marginTop: 16 }]}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="Username"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
        />

        <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
          <Text style={styles.btnSaveText}>{saved ? 'Saved ✓' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Darija Translator v1.0{'\n'}
          React Native Mobile Client{'\n'}
          Mini Project 2 — LLM-powered RESTful Web Service{'\n\n'}
          Translates text to Moroccan Arabic Dialect (Darija) using Google Gemini AI via a secured Jakarta RESTful Web Service.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: {
    backgroundColor: '#1a1a2e', paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center',
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  headerSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: 'white', borderRadius: 12, margin: 12, marginBottom: 0,
    padding: 16, shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: '#dde1e7', borderRadius: 8,
    padding: 10, fontSize: 14, color: '#1a1a2e',
  },
  hint: { fontSize: 11, color: '#aaa', marginTop: 6, lineHeight: 17 },
  btnSave: {
    marginTop: 16, backgroundColor: '#1a1a2e', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  btnSaveText:  { color: 'white', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10 },
  aboutText:    { fontSize: 13, color: '#777', lineHeight: 21 },
});
