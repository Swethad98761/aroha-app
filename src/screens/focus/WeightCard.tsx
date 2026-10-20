// src/screens/focus/WeightCard.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, AppLayout } from '../../theme';
import { Card } from '../../components/SharedComponents';

const WEIGHT_KEY = 'aroha_weight_log_v2';
const TARGET_KEY = 'aroha_weight_target';
const ACCENT = '#FF6B35';
const TARGET_COLOR = '#34C759';
const W = Dimensions.get('window').width - AppLayout.screenMargin * 2 - 32;
const H = 110;

type Entry = { date: string; kg: number };

function dateStr(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

export function WeightCard() {
  const [log, setLog] = useState<Entry[]>([]);
  const [target, setTarget] = useState<number | null>(null);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [targetInput, setTargetInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(WEIGHT_KEY).then(v => { if (v) setLog(JSON.parse(v)); });
    AsyncStorage.getItem(TARGET_KEY).then(v => { if (v) setTarget(parseFloat(v)); });
  }, []);

  const today = new Date();
  const todayStr = dateStr(today);
  const todayEntry = log.find(e => e.date === todayStr);
  const latest = log[log.length - 1];

  function toKg(val: number) { return unit === 'lbs' ? val / 2.205 : val; }
  function fromKg(kg: number) { return unit === 'kg' ? kg : kg * 2.205; }
  function fmt(kg: number) { return `${fromKg(kg).toFixed(1)} ${unit}`; }

  function saveWeight() {
    const kg = toKg(parseFloat(inputVal));
    if (!kg || kg < 20 || kg > 500) { Alert.alert('Enter a valid weight'); return; }
    const updated = [...log.filter(e => e.date !== todayStr), { date: todayStr, kg }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setLog(updated);
    AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(updated));
    setInputVal('');
    setShowLogModal(false);
  }

  function saveTarget() {
    const kg = toKg(parseFloat(targetInput));
    if (!kg || kg < 20 || kg > 500) { Alert.alert('Enter a valid target'); return; }
    setTarget(kg);
    AsyncStorage.setItem(TARGET_KEY, String(kg));
    setTargetInput('');
    setShowTargetModal(false);
  }

  // Build chart points: last 5 logged + today + tomorrow (projected)
  // Show a 7-day window centered around today
  const windowDays = 7;
  const startDay = addDays(today, -4); // 4 days back
  const days = Array.from({ length: windowDays }, (_, i) => addDays(startDay, i));
  // day +2 = tomorrow, day +3 = day after = future (just show target)

  const chartPoints = days.map(d => {
    const ds = dateStr(d);
    const entry = log.find(e => e.date === ds);
    return { date: d, ds, kg: entry?.kg ?? null, isToday: ds === todayStr, isFuture: d > today };
  });

  // Chart bounds
  const allKg = [
    ...chartPoints.filter(p => p.kg !== null).map(p => p.kg as number),
    ...(target ? [target] : []),
  ];
  const minV = allKg.length > 0 ? Math.min(...allKg) - 2 : 60;
  const maxV = allKg.length > 0 ? Math.max(...allKg) + 2 : 100;

  function cx(i: number) { return (i / (windowDays - 1)) * W; }
  function cy(v: number) { return H - ((v - minV) / (maxV - minV || 1)) * H; }

  // Actual weight path — only through logged points
  const loggedPts = chartPoints.filter(p => p.kg !== null);
  const actualPath = loggedPts.length > 1
    ? loggedPts.map((p, i) => {
        const idx = days.findIndex(d => dateStr(d) === p.ds);
        return `${i === 0 ? 'M' : 'L'}${cx(idx).toFixed(1)} ${cy(p.kg!).toFixed(1)}`;
      }).join(' ')
    : '';

  // Target line — full width
  const targetY = target ? cy(target) : null;

  const change = latest && log.length > 1 ? latest.kg - log[0].kg : null;

  return (
    <Card>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.secondaryLabel, letterSpacing: 0.8 }}>
          WEIGHT PROGRESS
        </Text>
        <TouchableOpacity onPress={() => setUnit(u => u === 'kg' ? 'lbs' : 'kg')}
          style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F0F0F0' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel }}>{unit.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10,
          backgroundColor: '#FFF5F0', borderRadius: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 }}>CURRENT</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: ACCENT, marginTop: 2 }}>
            {latest ? fmt(latest.kg) : '—'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowTargetModal(true)}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10,
            backgroundColor: '#F0FFF4', borderRadius: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 }}>TARGET</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: TARGET_COLOR, marginTop: 2 }}>
            {target ? fmt(target) : 'Set →'}
          </Text>
        </TouchableOpacity>
        {change !== null && (
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10,
            backgroundColor: change <= 0 ? '#F0FFF4' : '#FFF0F0', borderRadius: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 }}>CHANGE</Text>
            <Text style={{ fontSize: 20, fontWeight: '900',
              color: change <= 0 ? '#34C759' : '#FF3B30', marginTop: 2 }}>
              {change > 0 ? '+' : ''}{fromKg(Math.abs(change)).toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={{ marginBottom: 14 }}>
        <Svg width={W} height={H + 28}>
          {/* Target line */}
          {targetY !== null && (
            <>
              <Line x1={0} y1={targetY} x2={W} y2={targetY}
                stroke={TARGET_COLOR} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7} />
              <SvgText x={W - 2} y={targetY - 4} fontSize={9} fill={TARGET_COLOR}
                textAnchor="end" fontWeight="700">TARGET</SvgText>
            </>
          )}
          {/* Baseline */}
          <Line x1={0} y1={H} x2={W} y2={H} stroke="#F0F0F0" strokeWidth={1} />
          {/* Actual path */}
          {actualPath ? (
            <Path d={actualPath} stroke={ACCENT} strokeWidth={2.5} fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {/* Day dots + labels */}
          {chartPoints.map((p, i) => (
            <React.Fragment key={i}>
              {/* Day label */}
              <SvgText x={cx(i)} y={H + 18} fontSize={9} fill={p.isToday ? ACCENT : '#CCC'}
                textAnchor="middle" fontWeight={p.isToday ? '800' : '400'}>
                {p.isToday ? 'Today' : p.date.toLocaleDateString('en', { weekday: 'short' })}
              </SvgText>
              {/* Dot if logged */}
              {p.kg !== null && (
                <>
                  <Circle cx={cx(i)} cy={cy(p.kg)} r={p.isToday ? 6 : 4}
                    fill={p.isToday ? ACCENT : ACCENT + '88'}
                    stroke="#fff" strokeWidth={1.5} />
                  <SvgText x={cx(i)} y={cy(p.kg) - 10} fontSize={9} fill={ACCENT}
                    textAnchor="middle" fontWeight="700">
                    {fromKg(p.kg).toFixed(1)}
                  </SvgText>
                </>
              )}
              {/* Empty dot for unlogged past days */}
              {p.kg === null && !p.isFuture && (
                <Circle cx={cx(i)} cy={H / 2} r={3} fill="#E8E8E8" />
              )}
              {/* Future dot on target line */}
              {p.isFuture && targetY !== null && (
                <Circle cx={cx(i)} cy={targetY} r={3}
                  fill="none" stroke={TARGET_COLOR} strokeWidth={1.5} strokeDasharray="2 2" />
              )}
            </React.Fragment>
          ))}
        </Svg>
        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 12, height: 3, backgroundColor: ACCENT, borderRadius: 2 }} />
            <Text style={{ fontSize: 10, color: '#AAA', fontWeight: '600' }}>Actual</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 12, height: 1.5, borderStyle: 'dashed',
              borderWidth: 1, borderColor: TARGET_COLOR }} />
            <Text style={{ fontSize: 10, color: '#AAA', fontWeight: '600' }}>Target</Text>
          </View>
        </View>
      </View>

      {/* Log button */}
      <TouchableOpacity onPress={() => setShowLogModal(true)}
        style={{ backgroundColor: todayEntry ? '#F5F5F5' : ACCENT, borderRadius: 12,
          paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: todayEntry ? Colors.secondaryLabel : '#fff', fontWeight: '700', fontSize: 14 }}>
          {todayEntry ? `✓ Today: ${fmt(todayEntry.kg)}  ·  Edit` : '+ Log Today\'s Weight'}
        </Text>
      </TouchableOpacity>

      {/* Log Modal */}
      <Modal visible={showLogModal} transparent animationType="fade" onRequestClose={() => setShowLogModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center', paddingHorizontal: 32 }}
          activeOpacity={1} onPress={() => setShowLogModal(false)}>
          <TouchableOpacity activeOpacity={1}
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.label, marginBottom: 16 }}>
              Log Weight
            </Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: ACCENT + '60', borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 14, fontSize: 28, fontWeight: '700',
                color: Colors.label, textAlign: 'center', marginBottom: 16 }}
              placeholder={`0.0 ${unit}`}
              placeholderTextColor={Colors.tertiaryLabel}
              keyboardType="decimal-pad"
              value={inputVal}
              onChangeText={setInputVal}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowLogModal(false)}
                style={{ flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
                  paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', color: Colors.secondaryLabel }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveWeight}
                style={{ flex: 1, backgroundColor: ACCENT, borderRadius: 12,
                  paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Target Modal */}
      <Modal visible={showTargetModal} transparent animationType="fade" onRequestClose={() => setShowTargetModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center', paddingHorizontal: 32 }}
          activeOpacity={1} onPress={() => setShowTargetModal(false)}>
          <TouchableOpacity activeOpacity={1}
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.label, marginBottom: 4 }}>
              Set Target Weight
            </Text>
            <Text style={{ fontSize: 13, color: Colors.secondaryLabel, marginBottom: 16 }}>
              This will show as a goal line on your chart
            </Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: TARGET_COLOR + '80', borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 14, fontSize: 28, fontWeight: '700',
                color: Colors.label, textAlign: 'center', marginBottom: 16 }}
              placeholder={`0.0 ${unit}`}
              placeholderTextColor={Colors.tertiaryLabel}
              keyboardType="decimal-pad"
              value={targetInput}
              onChangeText={setTargetInput}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowTargetModal(false)}
                style={{ flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
                  paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', color: Colors.secondaryLabel }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveTarget}
                style={{ flex: 1, backgroundColor: TARGET_COLOR, borderRadius: 12,
                  paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
}
