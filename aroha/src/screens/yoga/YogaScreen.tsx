// src/screens/yoga/YogaScreen.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme, cardStyle } from '../../theme';
import { TechLogoHeader, Card, EmptyState } from '../../components/SharedComponents';
import { YogaConsistencyDashboard } from '../../components/ConsistencyDashboard';
import { formatTime, formatDateShort } from '../../utils';
import { YogaSession, YogaFlow, Asana } from '../../db/database';
import { AsanaLibraryModal } from './AsanaLibraryModal';

const ACCENT = AppTheme.yoga.accentColor;

export default function YogaScreen() {
  const { goals, yogaSessions, yogaFlows, asanas, addYogaSession, removeYogaSession } = useAppStore();

  const [activeSessionName, setActiveSessionName] = useState<string | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(null);
  const [activeFlow, setActiveFlow] = useState<YogaFlow | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showFlowMenu, setShowFlowMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [editSession, setEditSession] = useState<YogaSession | null>(null);

  const yogaDates = yogaSessions.map((s) => s.date);

  useEffect(() => {
    if (activeStartDate) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeStartDate.getTime()) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeStartDate]);

  function startSession(name: string, flow?: YogaFlow) {
    setActiveSessionName(name);
    setActiveStartDate(new Date());
    setActiveFlow(flow ?? null);
    setElapsed(0);
    setShowFlowMenu(false);
  }

  function completeSession() {
    if (!activeSessionName || !activeStartDate) return;
    const cats = activeFlow ? Array.from(new Set(activeFlow.asanas?.flatMap((a) => a.categories) ?? [])) : [];
    addYogaSession({ name: activeSessionName, date: new Date().toISOString(), duration: elapsed, categories: cats });
    clearActive();
  }

  function clearActive() {
    setActiveSessionName(null); setActiveStartDate(null); setActiveFlow(null); setElapsed(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function confirmDelete(session: YogaSession) {
    Alert.alert('Delete Session?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeYogaSession(session.id) },
    ]);
  }

  if (!goals) return null;

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
      <TechLogoHeader title="Yoga" accentColor={ACCENT} />
      <View style={styles.inner}>
        <YogaConsistencyDashboard goals={goals} accentColor={ACCENT} yogaDates={yogaDates} />

        {/* Active session or Start button */}
        {activeSessionName ? (
          <Card style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <View>
                <Text style={styles.activeName}>{activeSessionName}</Text>
                {activeFlow && <Text style={styles.activeFlow}>Flow: {activeFlow.name}</Text>}
              </View>
              <Text style={[styles.activeTimer, { color: ACCENT }]}>{formatTime(elapsed)}</Text>
            </View>
            {activeFlow?.asanas && activeFlow.asanas.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.asanaScroll}>
                {activeFlow.asanas.map((a) => (
                  <View key={a.id} style={[styles.asanaChip, { borderColor: ACCENT }]}>
                    <Text style={[styles.asanaChipLabel, { color: ACCENT }]}>{a.name}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.activeBtns}>
              <TouchableOpacity style={[styles.finishBtn, { backgroundColor: ACCENT }]} onPress={() => Alert.alert('Complete Session?', `Duration: ${formatTime(elapsed)}`, [{ text: 'Keep Going', style: 'cancel' }, { text: 'Finish', onPress: completeSession }])}>
                <Text style={styles.finishBtnLabel}>✓ Finish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardBtn} onPress={() => Alert.alert('Discard Session?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: clearActive }])}>
                <Text style={styles.discardBtnLabel}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]}
            onPress={() => yogaFlows.length > 0 ? setShowFlowMenu(true) : startSession(`Freestyle – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnLabel}>▶  Start New Yoga</Text>
          </TouchableOpacity>
        )}

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => setShowLibrary(true)}>
            <Text style={[styles.toolbarLink, { color: ACCENT }]}>📚 Yoga Library</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowManual(true)}>
            <Text style={[styles.toolbarLink, { color: Colors.purple }]}>＋ Log Manual</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Yoga History</Text>
        {yogaSessions.length === 0 ? (
          <EmptyState icon="🧘" title="No Yoga Sessions Yet" subtitle="Start a practice to see your history" />
        ) : (
          <View style={styles.list}>
            {yogaSessions.map((session) => (
              <TouchableOpacity key={session.id} style={styles.sessionRow} onPress={() => setEditSession(session)} onLongPress={() => confirmDelete(session)} activeOpacity={0.7}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <Text style={styles.sessionMeta}>{formatDateShort(session.date)} · {formatTime(session.duration)}</Text>
                  <View style={styles.cats}>
                    {session.categories.slice(0, 3).map((c) => (
                      <View key={c} style={[styles.catBadge, { backgroundColor: ACCENT + '18' }]}>
                        <Text style={[styles.catBadgeLabel, { color: ACCENT }]}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Flow picker */}
      <Modal visible={showFlowMenu} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowFlowMenu(false)}>
        <View style={styles.menu}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Start Yoga</Text>
            <TouchableOpacity onPress={() => setShowFlowMenu(false)}><Text style={styles.menuClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity style={styles.menuItem} onPress={() => startSession(`Freestyle – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)}>
              <Text style={styles.menuIcon}>🧘</Text>
              <Text style={styles.menuLabel}>Freestyle (Empty Flow)</Text>
            </TouchableOpacity>
            {yogaFlows.length > 0 && <Text style={styles.menuSection}>FROM FLOW</Text>}
            {yogaFlows.map((f) => (
              <TouchableOpacity key={f.id} style={styles.menuItem} onPress={() => startSession(`${f.name} Flow`, f)}>
                <Text style={styles.menuIcon}>✦</Text>
                <Text style={styles.menuLabel}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <AsanaLibraryModal visible={showLibrary} onClose={() => setShowLibrary(false)} />
      <ManualYogaModal visible={showManual} onClose={() => setShowManual(false)} />
      {editSession && <EditYogaSessionModal session={editSession} onClose={() => setEditSession(null)} />}
    </ScrollView>
  );
}

// ─── Manual Yoga Log ──────────────────────────────────────────────
function ManualYogaModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addYogaSession, asanas } = useAppStore();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAsanas, setSelectedAsanas] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  function save() {
    const cats = Array.from(new Set(asanas.filter((a) => selectedAsanas.includes(a.id)).flatMap((a) => a.categories)));
    addYogaSession({
      name: name.trim() || `Yoga on ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      date: new Date(date).toISOString(),
      duration: parseFloat(duration) * 60 || 0,
      categories: cats,
    });
    setName(''); setDuration('30'); setSelectedAsanas([]); onClose();
  }

  const filtered = asanas.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: Colors.blue, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.menuTitle}>Manual Yoga Log</Text>
          <TouchableOpacity onPress={save}><Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700' }}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: AppLayout.screenMargin, gap: 14 }}>
          <SimpleField label="Name (optional)" value={name} onChange={setName} />
          <SimpleField label="Date (YYYY-MM-DD)" value={date} onChange={setDate} />
          <SimpleField label="Duration (minutes)" value={duration} onChange={setDuration} numeric />
          <Text style={styles.menuSection}>ASANAS PRACTICED</Text>
          <TextInput style={{ padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 15, marginBottom: 4 }} placeholder="Search asanas…" value={search} onChangeText={setSearch} />
          {filtered.map((a) => {
            const sel = selectedAsanas.includes(a.id);
            return (
              <TouchableOpacity key={a.id} style={[styles.menuItem, { backgroundColor: sel ? ACCENT + '10' : 'transparent' }]} onPress={() => setSelectedAsanas(sel ? selectedAsanas.filter((id) => id !== a.id) : [...selectedAsanas, a.id])}>
                <View style={[styles.checkbox, sel && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
                  {sel && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                </View>
                <Text style={styles.menuLabel}>{a.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Edit Yoga Session ────────────────────────────────────────────
function EditYogaSessionModal({ session, onClose }: { session: YogaSession; onClose: () => void }) {
  const { saveYogaSession, removeYogaSession } = useAppStore();
  const [name, setName] = useState(session.name);
  const [duration, setDuration] = useState(String(Math.round(session.duration / 60)));

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: Colors.blue, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.menuTitle}>Edit Session</Text>
          <TouchableOpacity onPress={() => { saveYogaSession({ ...session, name, duration: parseFloat(duration) * 60 || session.duration }); onClose(); }}>
            <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: AppLayout.screenMargin, gap: 14 }}>
          <SimpleField label="Name" value={name} onChange={setName} />
          <SimpleField label="Duration (minutes)" value={duration} onChange={setDuration} numeric />
          <TouchableOpacity style={styles.deleteBtn2} onPress={() => Alert.alert('Delete Session?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { removeYogaSession(session.id); onClose(); } }])}>
            <Text style={styles.deleteBtnLabel}>🗑 Delete Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SimpleField({ label, value, onChange, numeric }: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel }}>{label}</Text>
      <TextInput style={{ borderBottomWidth: 1, borderBottomColor: Colors.separator, fontSize: 16, paddingBottom: 6, color: Colors.label }} value={value} onChangeText={onChange} keyboardType={numeric ? 'decimal-pad' : 'default'} />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  inner: { paddingHorizontal: AppLayout.screenMargin, gap: AppLayout.sectionSpacing },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: AppLayout.cornerRadius, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  startBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  activeCard: { gap: 12 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeName: { fontSize: 16, fontWeight: '700', color: Colors.label },
  activeFlow: { fontSize: 13, color: Colors.secondaryLabel, marginTop: 2 },
  activeTimer: { fontSize: 26, fontWeight: '800' },
  asanaScroll: { maxHeight: 44 },
  asanaChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  asanaChipLabel: { fontSize: 12, fontWeight: '600' },
  activeBtns: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  finishBtn: { flex: 1, paddingVertical: 10, borderRadius: AppLayout.cornerRadius, alignItems: 'center' },
  finishBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  discardBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondaryBackground, alignItems: 'center', justifyContent: 'center' },
  discardBtnLabel: { color: Colors.secondaryLabel, fontSize: 18 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between' },
  toolbarLink: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: Colors.label },
  list: { gap: AppLayout.rowSpacing },
  sessionRow: { ...cardStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  sessionLeft: { flex: 1, gap: 4 },
  sessionName: { fontSize: 15, fontWeight: '700', color: Colors.label },
  sessionMeta: { fontSize: 12, color: Colors.secondaryLabel },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  catBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeLabel: { fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 22, color: Colors.tertiaryLabel },
  menu: { flex: 1, backgroundColor: '#fff' },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  menuTitle: { fontSize: 17, fontWeight: '700' },
  menuClose: { fontSize: 18, color: Colors.secondaryLabel },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { fontSize: 15, color: Colors.label, flex: 1 },
  menuSection: { fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1, padding: 16, paddingBottom: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.separator, alignItems: 'center', justifyContent: 'center' },
  deleteBtn2: { marginTop: 20, padding: 14, backgroundColor: '#FF3B3010', borderRadius: AppLayout.cornerRadius, alignItems: 'center' },
  deleteBtnLabel: { color: Colors.red, fontWeight: '700', fontSize: 15 },
});
