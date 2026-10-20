import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../store/AuthStore';
import { MoodLogo } from '../../components/MoodLogo';

export default function UsernameScreen() {
  const { setUsername, email } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (name.trim().length < 2) { Alert.alert('Please enter at least 2 characters'); return; }
    setLoading(true);
    await setUsername(name.trim());
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <MoodLogo color="#FF5500" size="lg" />
      <View style={styles.gradLine} />
      <Text style={styles.title}>Namaste 🙏</Text>
      <Text style={styles.sub}>What shall we call you?</Text>
      <View style={styles.inputLine}>
        <TextInput
          style={styles.input}
          placeholder="Your name..."
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          maxLength={30}
          placeholderTextColor="#CCC"
          textAlign="center"
        />
      </View>
      <TouchableOpacity style={styles.gradBtn} onPress={handleContinue} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.gradBtnLabel}>Begin My Journey →</Text>}
      </TouchableOpacity>
      <Text style={styles.tagline}>Ancient wisdom · Modern practice</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  gradLine: { height: 1.5, width: '100%', borderBottomWidth: 1.5, borderBottomColor: '#FF5500', marginVertical: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#111' },
  sub: { fontSize: 14, color: '#888' },
  inputLine: { width: '100%', borderBottomWidth: 2, borderBottomColor: '#111', marginBottom: 8 },
  input: { fontSize: 20, fontWeight: '700', color: '#111', paddingVertical: 10 },
  gradBtn: { width: '100%', borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: '#FF5500', shadowColor: '#FF5500', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  gradBtnLabel: { color: '#fff', fontWeight: '800', fontSize: 17 },
  tagline: { fontSize: 11, color: '#CCC', letterSpacing: 1 },
});
