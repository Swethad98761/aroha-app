// src/screens/workouts/BodyWeightLogCard.tsx
// Simple weekly weight log — modal input, no popup overlap

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme';

const WEIGHT_KEY = 'aroha_weight_log_v2';
const ACCENT = '#FF6B35';
type Entry = { date: string; kg: number };

export function BodyWeightLogCard() {
  const [log, setLog] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WEIGHT_KEY).then(v => { if (v) setLog(JSON.parse(v)); });
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = log.find(e => e.date === todayStr);
  const latest = log[log.length - 1];
  const daysSinceLast = latest
    ? Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000)
    : 999;
  const canLog = daysSinceLast >= 6 || !latest || latest.date === todayStr;

  function toDisplay(kg: number) {
    return unit === 'kg' ? `${kg.toFixed(1)} kg` : `${(kg * 2.205).toFixed(1)} lbs`;
  }

  function save() {
    const raw = parseFloat(input);
    const kg = unit === 'lbs' ? raw / 2.205 : raw;
    if (!kg || kg < 20 || kg > 500) { Alert.alert('Enter a valid weight'); return; }
    const updated = [...log.filter(e => e.date !== todayStr), { date: todayStr, kg }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setLog(updated);
    AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(updated));
    setInput('');
    setShowModal(false);
  }

  return (
    <>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14,
        marginBottom: 12, flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 12 }}>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.label }}>⚖️ Body Weight</Text>
          <Text style={{ fontSize: 12, color: Colors.secondaryLabel, marginTop: 2 }}>
            {todayEntry
              ? `Today: ${toDisplay(todayEntry.kg)}`
              : latest
              ? `Last: ${toDisplay(latest.kg)} · ${daysSinceLast}d ago`
              : 'Log weekly to track progress'}
          </Text>
          {!canLog && (
            <Text style={{ fontSize: 10, color: Colors.tertiaryLabel, marginTop: 2 }}>
              Next log in {7 - daysSinceLast} days · See chart in Prakriti 🏔
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={() => setUnit(u => u === 'kg' ? 'lbs' : 'kg')}
          style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: '#F0F0F0' }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.secondaryLabel }}>{unit.toUpperCase()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => canLog
            ? setShowModal(true)
            : Alert.alert('Log weekly', `Next log available in ${7 - daysSinceLast} days.\nSee your chart in the Prakriti tab 🏔`)}
          style={{ backgroundColor: canLog ? ACCENT : '#E8E8E8', borderRadius: 10,
            paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: canLog ? '#fff' : '#AAA' }}>
            {todayEntry ? '✏️ Edit' : '+ Log'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal input */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 32 }}
          activeOpacity={1} onPress={() => setShowModal(false)}>
          <TouchableOpacity activeOpacity={1}
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.label, marginBottom: 4 }}>Log Body Weight</Text>
            <Text style={{ fontSize: 13, color: Colors.secondaryLabel, marginBottom: 16 }}>
              {todayEntry ? `Current: ${toDisplay(todayEntry.kg)}` : 'Enter your weight below'}
            </Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: ACCENT + '60', borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 12, fontSize: 24, fontWeight: '700',
                color: Colors.label, textAlign: 'center', marginBottom: 16 }}
              placeholder={`0.0 ${unit}`}
              placeholderTextColor={Colors.tertiaryLabel}
              keyboardType="decimal-pad"
              value={input}
              onChangeText={setInput}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setUnit(u => u === 'kg' ? 'lbs' : 'kg')}
                style={{ flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
                  paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: Colors.secondaryLabel }}>Switch to {unit === 'kg' ? 'lbs' : 'kg'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save}
                style={{ flex: 1, backgroundColor: ACCENT, borderRadius: 12,
                  paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
