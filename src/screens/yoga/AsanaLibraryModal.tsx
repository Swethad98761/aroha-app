// src/screens/yoga/AsanaLibraryModal.tsx

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAppStore } from '../../store/AppStore';
import { AppLayout, Colors, AppTheme } from '../../theme';
import { Asana, YogaFlow } from '../../db/database';

const ACCENT = AppTheme.yoga.accentColor;
const YOGA_CATS = ['All', 'Standing', 'Balance', 'Inversion', 'Backbend', 'Core', 'Strength', 'Flexibility', 'Restorative', 'Mindfulness', 'Hips', 'Hamstrings', 'Quads', 'Spine'];

interface Props { visible: boolean; onClose: () => void; }

export function AsanaLibraryModal({ visible, onClose }: Props) {
  const { asanas, yogaFlows, addAsana, saveAsana, removeAsana, addYogaFlow, saveYogaFlow, removeYogaFlow, saveFlowAsanas } = useAppStore();
  const [tab, setTab] = useState<'asanas' | 'flows'>('asanas');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // Asana add/edit
  const [showAddAsana, setShowAddAsana] = useState(false);
  const [newAsanaName, setNewAsanaName] = useState('');
  const [newAsanaCats, setNewAsanaCats] = useState<string[]>([]);
  const [editAsana, setEditAsana] = useState<Asana | null>(null);

  // Flow add/edit
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [editFlow, setEditFlow] = useState<YogaFlow | null>(null);

  const filtered = useMemo(() => {
    return asanas.filter((a) => {
      const matchCat = selectedCat === 'All' || a.categories.includes(selectedCat);
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [asanas, search, selectedCat]);

  function addAsanaFn() {
    if (!newAsanaName.trim()) return;
    addAsana(newAsanaName.trim(), newAsanaCats);
    setNewAsanaName(''); setNewAsanaCats([]); setShowAddAsana(false);
  }

  function saveAsanaFn() {
    if (!editAsana) return;
    saveAsana(editAsana);
    setEditAsana(null);
  }

  function addFlowFn() {
    if (!newFlowName.trim()) return;
    addYogaFlow(newFlowName.trim());
    setNewFlowName(''); setShowAddFlow(false);
  }

  function toggleFlowAsana(asanaId: string) {
    if (!editFlow) return;
    const current = editFlow.asanas?.map((a) => a.id) ?? [];
    const next = current.includes(asanaId) ? current.filter((id) => id !== asanaId) : [...current, asanaId];
    saveFlowAsanas(editFlow.id, next);
    const updatedAsanas = asanas.filter((a) => next.includes(a.id));
    setEditFlow({ ...editFlow, asanas: updatedAsanas });
  }

  function toggleCat(cat: string, currentCats: string[], setter: (c: string[]) => void) {
    setter(currentCats.includes(cat) ? currentCats.filter((c) => c !== cat) : [...currentCats, cat]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Yoga Library</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {(['asanas', 'flows'] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]} onPress={() => setTab(t)}>
              <Text style={[styles.tabLabel, tab === t && { color: ACCENT }]}>{t === 'asanas' ? 'Asanas' : 'Flows'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'asanas' ? (
          <>
            <TextInput style={styles.search} placeholder="Search…" value={search} onChangeText={setSearch} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: AppLayout.screenMargin }}>
              {YOGA_CATS.map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, selectedCat === c && { backgroundColor: ACCENT }]} onPress={() => setSelectedCat(c)}>
                  <Text style={[styles.chipLabel, selectedCat === c && { color: '#fff' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
              {filtered.map((a) => (
                <TouchableOpacity key={a.id} style={styles.row} onPress={() => setEditAsana({ ...a })}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowName}>{a.name}</Text>
                    <Text style={styles.rowMeta}>{a.categories.join(', ')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Delete Asana?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeAsana(a.id) }])}>
                    <Text style={styles.deleteBtn}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.fab, { backgroundColor: ACCENT }]} onPress={() => setShowAddAsana(true)}>
              <Text style={styles.fabLabel}>＋ Add Asana</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={{ padding: AppLayout.screenMargin, gap: 12, paddingBottom: 80 }}>
              {yogaFlows.length === 0 && <Text style={styles.empty}>No flows yet. Create one to build a sequence.</Text>}
              {yogaFlows.map((f) => (
                <TouchableOpacity key={f.id} style={styles.flowRow} onPress={() => setEditFlow({ ...f })}>
                  <View>
                    <Text style={styles.rowName}>{f.name}</Text>
                    <Text style={styles.rowMeta}>{f.asanas?.length ?? 0} asanas</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Delete Flow?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeYogaFlow(f.id) }])}>
                    <Text style={styles.deleteBtn}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.fab, { backgroundColor: ACCENT }]} onPress={() => setShowAddFlow(true)}>
              <Text style={styles.fabLabel}>＋ New Flow</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Add Asana Sheet */}
        <Modal visible={showAddAsana} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAddAsana(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowAddAsana(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.sheetTitle}>New Asana</Text>
              <TouchableOpacity onPress={addAsanaFn}><Text style={[styles.saveBtn, { color: ACCENT }]}>Add</Text></TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.fieldInput} value={newAsanaName} onChangeText={setNewAsanaName} placeholder="Asana name" autoFocus />
              <Text style={styles.fieldLabel}>Categories</Text>
              <View style={styles.catGrid}>
                {YOGA_CATS.filter((c) => c !== 'All').map((c) => {
                  const sel = newAsanaCats.includes(c);
                  return (
                    <TouchableOpacity key={c} style={[styles.chip, sel && { backgroundColor: ACCENT }]} onPress={() => toggleCat(c, newAsanaCats, setNewAsanaCats)}>
                      <Text style={[styles.chipLabel, sel && { color: '#fff' }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Asana Sheet */}
        <Modal visible={!!editAsana} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setEditAsana(null)}>
          {editAsana && (
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setEditAsana(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
                <Text style={styles.sheetTitle}>Edit Asana</Text>
                <TouchableOpacity onPress={saveAsanaFn}><Text style={[styles.saveBtn, { color: ACCENT }]}>Save</Text></TouchableOpacity>
              </View>
              <View style={styles.sheetBody}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.fieldInput} value={editAsana.name} onChangeText={(t) => setEditAsana({ ...editAsana, name: t })} />
                <Text style={styles.fieldLabel}>Categories</Text>
                <View style={styles.catGrid}>
                  {YOGA_CATS.filter((c) => c !== 'All').map((c) => {
                    const sel = editAsana.categories.includes(c);
                    return (
                      <TouchableOpacity key={c} style={[styles.chip, sel && { backgroundColor: ACCENT }]} onPress={() => setEditAsana({ ...editAsana, categories: sel ? editAsana.categories.filter((x) => x !== c) : [...editAsana.categories, c] })}>
                        <Text style={[styles.chipLabel, sel && { color: '#fff' }]}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </Modal>

        {/* Add Flow */}
        <Modal visible={showAddFlow} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAddFlow(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowAddFlow(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.sheetTitle}>New Flow</Text>
              <TouchableOpacity onPress={addFlowFn}><Text style={[styles.saveBtn, { color: ACCENT }]}>Create</Text></TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>Flow Name</Text>
              <TextInput style={styles.fieldInput} value={newFlowName} onChangeText={setNewFlowName} placeholder="e.g. Morning Flow" autoFocus />
            </View>
          </View>
        </Modal>

        {/* Edit Flow (asana picker) */}
        <Modal visible={!!editFlow} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditFlow(null)}>
          {editFlow && (
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setEditFlow(null)}><Text style={styles.cancel}>Done</Text></TouchableOpacity>
                <Text style={styles.sheetTitle}>{editFlow.name}</Text>
                <TouchableOpacity onPress={() => { saveYogaFlow(editFlow.id, editFlow.name); setEditFlow(null); }}><Text style={[styles.saveBtn, { color: ACCENT }]}>Save</Text></TouchableOpacity>
              </View>
              <TextInput
                style={{ margin: 12, padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 16 }}
                value={editFlow.name}
                onChangeText={(t) => setEditFlow({ ...editFlow, name: t })}
                placeholder="Flow name"
              />
              <Text style={styles.sectionLabel2}>ASANAS IN FLOW ({editFlow.asanas?.length ?? 0})</Text>
              <ScrollView>
                {asanas.map((a) => {
                  const included = editFlow.asanas?.some((fa) => fa.id === a.id);
                  return (
                    <TouchableOpacity key={a.id} style={[styles.row, included && { backgroundColor: ACCENT + '08' }]} onPress={() => toggleFlowAsana(a.id)}>
                      <View style={[styles.checkbox, included && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
                        {included && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                      </View>
                      <View style={styles.rowLeft}>
                        <Text style={styles.rowName}>{a.name}</Text>
                        <Text style={styles.rowMeta}>{a.categories.join(', ')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  title: { fontSize: 18, fontWeight: '700' },
  done: { fontSize: 16, color: Colors.blue },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.separator },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 15, fontWeight: '600', color: Colors.secondaryLabel },
  search: { margin: 12, padding: 10, backgroundColor: Colors.secondaryBackground, borderRadius: 10, fontSize: 15 },
  catScroll: { marginBottom: 8, maxHeight: 40 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.secondaryBackground },
  chipLabel: { fontSize: 13, fontWeight: '600', color: Colors.secondaryLabel },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  rowLeft: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: Colors.label },
  rowMeta: { fontSize: 12, color: Colors.secondaryLabel, marginTop: 2 },
  deleteBtn: { fontSize: 18, padding: 4 },
  empty: { color: Colors.secondaryLabel, fontSize: 15, textAlign: 'center', marginTop: 40 },
  flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: Colors.secondaryBackground, borderRadius: AppLayout.cornerRadius },
  fab: { position: 'absolute', bottom: 20, left: AppLayout.screenMargin, right: AppLayout.screenMargin, padding: 14, borderRadius: AppLayout.cornerRadius, alignItems: 'center' },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sheet: { flex: 1, backgroundColor: '#fff' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  sheetTitle: { fontSize: 17, fontWeight: '600' },
  cancel: { fontSize: 16, color: Colors.blue },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  sheetBody: { padding: AppLayout.screenMargin, gap: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel, letterSpacing: 0.5, marginBottom: 4 },
  fieldInput: { fontSize: 16, borderBottomWidth: 1, borderBottomColor: Colors.separator, paddingBottom: 8, color: Colors.label },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.separator, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sectionLabel2: { fontSize: 11, fontWeight: '800', color: Colors.secondaryLabel, letterSpacing: 1, margin: 16, marginBottom: 4 },
});
