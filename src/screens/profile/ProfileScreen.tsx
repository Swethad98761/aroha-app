import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Image,
} from 'react-native';
import { useAuth } from '../../store/AuthStore';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../store/AppStore';
import { Colors, AppLayout, cardStyle, AppTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { getWorkoutStats } from '../../db/workoutAnalytics';
import { exportAllData, importAllData } from '../../db/database';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const GOLD = '#D4A843';

export default function ProfileScreen() {
  const { username, email, signOut, setUsername } = useAuth();
  const { goals, updateGoals, workoutSessions, yogaSessions, meditationSessions } = useAppStore();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditGoals, setShowEditGoals] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEditBody, setShowEditBody] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newUsername, setNewUsername] = useState(username ?? '');
  const [newEmail, setNewEmail] = useState(email ?? '');
  const [resetSent, setResetSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const stats = useMemo(() => getWorkoutStats(), [workoutSessions]);
  const totalMedMins = meditationSessions.filter(m => m.isCompleted).reduce((s, m) => s + m.duration, 0);

  const AVATAR_COLORS = ['#D4A843', '#FF5500', '#DA70D6', '#34C759', '#007AFF', '#FF3B30'];

  async function handleSaveUsername() {
    if (newUsername.trim().length < 2) { Alert.alert('Name too short'); return; }
    await setUsername(newUsername.trim());
    setShowEditProfile(false);
  }

  async function handleChangeEmail() {
    if (!newEmail.trim() || !newEmail.includes('@')) { Alert.alert('Enter a valid email'); return; }
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) { Alert.alert('Error', error.message); return; }
    setEmailSent(true);
  }

  async function handleResetPassword() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) { Alert.alert('Error', error.message); return; }
    setResetSent(true);
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleResetAll() {
    Alert.alert('Reset All Data', 'This will clear all your goals.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset Goals', style: 'destructive', onPress: () => {
        updateGoals({ weeklyWorkoutGoal: 4, dailyDurationGoal: 45, targetWeight: 150, currentWeight: 150, weeklyYogaGoal: 3, dailyYogaDurationGoal: 30, weeklyMeditationGoal: 5, dailyMeditationDurationGoal: 15 });
        Alert.alert('Reset complete 🙏');
      }},
    ]);
  }

  const initials = (username ?? email ?? 'U').slice(0, 2).toUpperCase();

  async function handleExport() {
    try {
      const json = exportAllData();
      const date = new Date().toISOString().slice(0, 10);
      const uri = FileSystem.documentDirectory + `aroha-backup-${date}.json`;
      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Save your Aroha backup' });
      } else {
        Alert.alert('Backup saved', `Saved to:\n${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Could not create backup');
    }
  }

  async function handleImport() {
    Alert.alert(
      'Restore from backup',
      'This will replace your current data with the backup file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose file', onPress: async () => {
          try {
            const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
            if (res.canceled || !res.assets?.[0]) return;
            const content = await FileSystem.readAsStringAsync(res.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
            const result = importAllData(content);
            if (result.ok) {
              Alert.alert('Restored 🙏', result.message + '\n\nPlease restart the app to see your data.');
            } else {
              Alert.alert('Restore failed', result.message);
            }
          } catch (e: any) {
            Alert.alert('Restore failed', e?.message ?? 'Could not read file');
          }
        }},
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.signOutRow}>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutLabel}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            <View style={[styles.avatar, { borderColor: GOLD }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: GOLD }]}>{initials}</Text>
              )}
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { setNewUsername(username ?? ''); setShowEditProfile(true); }} activeOpacity={0.7}>
            <Text style={styles.profileName}>{username ?? 'Set your name'}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <Text style={styles.profileTap}>Tap name to edit ✎</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: '🔱', value: String(stats.totalWorkouts), label: 'Workouts', color: AppTheme.workouts.accentColor },
            { icon: '🪷', value: String(yogaSessions.length), label: 'Yoga', color: AppTheme.yoga.accentColor },
            { icon: 'ॐ', value: `${Math.round(totalMedMins / 60)}h`, label: 'Dhyana', color: GOLD },
            { icon: '🔥', value: `${stats.streak}d`, label: 'Streak', color: Colors.green },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.color + '25' }]}>
              {s.icon === '🔱' ? <Image source={require('../../../assets/gada_silver.png')} style={{ width: 18, height: 18 }} resizeMode="contain" /> : <Text style={{ fontSize: s.icon === 'ॐ' ? 16 : 18 }}>{s.icon}</Text>}
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.card}>
          <Row icon="👤" label="Edit Name" value={username ?? ''} onPress={() => { setNewUsername(username ?? ''); setShowEditProfile(true); }} />
          <Divider />
          <Row icon="📧" label="Change Email" value={email ?? ''} onPress={() => { setNewEmail(email ?? ''); setShowChangeEmail(true); }} />
          <Divider />
          <Row icon="🔑" label="Change Password" value="Send reset link" onPress={() => setShowResetPassword(true)} />
        </View>

        {/* Body */}
        <Text style={styles.sectionHeader}>SHARIRA (शरीर)</Text>
        <View style={styles.card}>
          <Row icon="⚖️" label="Current Weight" value={`${goals?.currentWeight ?? '—'} lbs`} onPress={() => setShowEditBody(true)} />
          <Divider />
          <Row icon="🎯" label="Target Weight" value={`${goals?.targetWeight ?? '—'} lbs`} onPress={() => setShowEditBody(true)} />
        </View>

        {/* Goals */}
        <Text style={styles.sectionHeader}>SANKALPAM (संकल्पम्)</Text>
        <View style={styles.card}>
          <Row icon="🔱" label="Weekly Workouts" value={`${goals?.weeklyWorkoutGoal ?? 4} days`} onPress={() => setShowEditGoals(true)} />
          <Divider />
          <Row icon="🪷" label="Weekly Yoga" value={`${goals?.weeklyYogaGoal ?? 3} days`} onPress={() => setShowEditGoals(true)} />
          <Divider />
          <Row icon="ॐ" label="Weekly Dhyana" value={`${goals?.weeklyMeditationGoal ?? 5} days`} onPress={() => setShowEditGoals(true)} />
          <Divider />
          <Row icon="⏱" label="Daily Duration" value={`${goals?.dailyDurationGoal ?? 45} min`} onPress={() => setShowEditGoals(true)} />
        </View>

        {/* Data & Backup */}
        <Text style={styles.sectionHeader}>DATA & BACKUP</Text>
        <View style={styles.card}>
          <Row icon="⬆️" label="Export My Data" value="Save a backup file" onPress={handleExport} />
          <Divider />
          <Row icon="⬇️" label="Import / Restore" value="Load a backup file" onPress={handleImport} />
        </View>
        <Text style={{ fontSize: 11, color: Colors.tertiaryLabel, paddingHorizontal: 6, marginTop: -6, marginBottom: 8, lineHeight: 16 }}>
          Your data lives only on this phone. Export regularly to keep a backup you can restore on a new device.
        </Text>

        {/* Danger */}
        <Text style={styles.sectionHeader}>DANGER ZONE</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleResetAll}>
            <Text style={styles.rowIcon}>🔄</Text>
            <Text style={[styles.rowLabel, { color: Colors.red }]}>Reset Goals & Preferences</Text>
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Delete Account', 'Contact support to permanently delete your account.')}>
            <Text style={styles.rowIcon}>🗑</Text>
            <Text style={[styles.rowLabel, { color: Colors.red }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Aroha · v1.0.0{'\n'}Ancient wisdom · Modern practice 🙏</Text>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowEditProfile(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveUsername}><Text style={[styles.modalSave, { color: GOLD }]}>Save</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TouchableOpacity onPress={handlePickPhoto} style={{ alignSelf: 'center', marginBottom: 20 }}>
              <View style={[styles.avatar, { borderColor: GOLD, width: 80, height: 80, borderRadius: 40 }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 76, height: 76, borderRadius: 38 }} />
                ) : (
                  <Text style={[styles.avatarText, { color: GOLD, fontSize: 26 }]}>{initials}</Text>
                )}
                <View style={[styles.avatarEditBadge, { width: 26, height: 26, borderRadius: 13 }]}>
                  <Text style={{ fontSize: 13 }}>📷</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: GOLD, textAlign: 'center', marginTop: 6, fontWeight: '600' }}>Change Photo</Text>
            </TouchableOpacity>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput style={styles.fieldInput} value={newUsername} onChangeText={setNewUsername}
              placeholder="Your name" autoFocus placeholderTextColor={Colors.tertiaryLabel} />
          </View>
        </View>
      </Modal>

      {/* Change Email Modal */}
      <Modal visible={showChangeEmail} animationType="slide" presentationStyle="formSheet" onRequestClose={() => { setShowChangeEmail(false); setEmailSent(false); }}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowChangeEmail(false); setEmailSent(false); }}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Change Email</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={[styles.modalBody, { alignItems: 'center', gap: 16, paddingTop: 32 }]}>
            {emailSent ? (
              <>
                <Text style={{ fontSize: 48 }}>📬</Text>
                <Text style={styles.modalTitle}>Verify your new email</Text>
                <Text style={{ color: Colors.secondaryLabel, textAlign: 'center', lineHeight: 22 }}>
                  A confirmation link was sent to{'\n'}<Text style={{ color: GOLD, fontWeight: '700' }}>{newEmail}</Text>{'\n\n'}Click the link to confirm the change.
                </Text>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: GOLD, width: '100%' }]} onPress={() => { setShowChangeEmail(false); setEmailSent(false); }}>
                  <Text style={styles.saveBtnLabel}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ color: Colors.secondaryLabel, textAlign: 'center', lineHeight: 22, fontSize: 14 }}>
                  Current email:{'\n'}<Text style={{ color: Colors.label, fontWeight: '600' }}>{email}</Text>
                </Text>
                <View style={{ width: '100%' }}>
                  <Text style={styles.fieldLabel}>New Email Address</Text>
                  <TextInput style={styles.fieldInput} value={newEmail} onChangeText={setNewEmail}
                    keyboardType="email-address" autoCapitalize="none" autoFocus
                    placeholder="new@email.com" placeholderTextColor={Colors.tertiaryLabel} />
                </View>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: GOLD, width: '100%' }]} onPress={handleChangeEmail}>
                  <Text style={styles.saveBtnLabel}>Send Confirmation Link</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={showResetPassword} animationType="slide" presentationStyle="formSheet" onRequestClose={() => { setShowResetPassword(false); setResetSent(false); }}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowResetPassword(false); setResetSent(false); }}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={[styles.modalBody, { alignItems: 'center', gap: 16, paddingTop: 40 }]}>
            {resetSent ? (
              <>
                <Text style={{ fontSize: 48 }}>📬</Text>
                <Text style={styles.modalTitle}>Check your inbox</Text>
                <Text style={{ color: Colors.secondaryLabel, textAlign: 'center', lineHeight: 22 }}>Reset link sent to{'\n'}<Text style={{ color: GOLD, fontWeight: '700' }}>{email}</Text></Text>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: GOLD, width: '100%' }]} onPress={() => { setShowResetPassword(false); setResetSent(false); }}>
                  <Text style={styles.saveBtnLabel}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ color: Colors.secondaryLabel, textAlign: 'center', lineHeight: 22, fontSize: 15 }}>
                  We'll send a reset link to{'\n'}<Text style={{ color: Colors.label, fontWeight: '600' }}>{email}</Text>
                </Text>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: GOLD, width: '100%' }]} onPress={handleResetPassword}>
                  <Text style={styles.saveBtnLabel}>Send Reset Link</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Goals Modal */}
      <Modal visible={showEditGoals} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditGoals(false)}>
        <EditGoalsModal goals={goals} accentColor={GOLD} onClose={() => setShowEditGoals(false)} onSave={(g: any) => { updateGoals(g); setShowEditGoals(false); }} />
      </Modal>

      {/* Edit Body Modal */}
      <Modal visible={showEditBody} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowEditBody(false)}>
        <EditBodyModal goals={goals} accentColor={GOLD} onClose={() => setShowEditBody(false)} onSave={(g: any) => { updateGoals(g); setShowEditBody(false); }} />
      </Modal>
    </View>
  );
}

function Row({ icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {icon === '🔱' ? <Image source={require('../../../assets/gada_silver.png')} style={{ width: 20, height: 20 }} resizeMode="contain" /> : <Text style={styles.rowIcon}>{icon}</Text>}
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.separator, marginLeft: 44 }} />;
}

function EditGoalsModal({ goals, accentColor, onClose, onSave }: any) {
  const [ww, setWw] = useState(String(goals?.weeklyWorkoutGoal ?? 4));
  const [dd, setDd] = useState(String(goals?.dailyDurationGoal ?? 45));
  const [wy, setWy] = useState(String(goals?.weeklyYogaGoal ?? 3));
  const [dy, setDy] = useState(String(goals?.dailyYogaDurationGoal ?? 30));
  const [wm, setWm] = useState(String(goals?.weeklyMeditationGoal ?? 5));
  const [dm, setDm] = useState(String(goals?.dailyMeditationDurationGoal ?? 15));
  const fields = [
    { label: '🔱 Weekly Workouts (days)', val: ww, set: setWw },
    { label: '⏱ Daily Workout Duration (min)', val: dd, set: setDd },
    { label: '🪷 Weekly Yoga (days)', val: wy, set: setWy },
    { label: '🪷 Daily Yoga Duration (min)', val: dy, set: setDy },
    { label: 'ॐ Weekly Meditation (days)', val: wm, set: setWm },
    { label: 'ॐ Daily Meditation Duration (min)', val: dm, set: setDm },
  ];
  return (
    <View style={styles.modal}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.modalTitle}>Edit Goals</Text>
        <TouchableOpacity onPress={() => onSave({ weeklyWorkoutGoal: parseInt(ww), dailyDurationGoal: parseFloat(dd), weeklyYogaGoal: parseInt(wy), dailyYogaDurationGoal: parseFloat(dy), weeklyMeditationGoal: parseInt(wm), dailyMeditationDurationGoal: parseFloat(dm) })}>
          <Text style={[styles.modalSave, { color: accentColor }]}>Save</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.modalBody}>
        {fields.map((f) => (
          <View key={f.label} style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <TextInput style={styles.fieldInput} value={f.val} onChangeText={f.set} keyboardType="decimal-pad" placeholderTextColor={Colors.tertiaryLabel} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function EditBodyModal({ goals, accentColor, onClose, onSave }: any) {
  const [cw, setCw] = useState(String(goals?.currentWeight ?? ''));
  const [tw, setTw] = useState(String(goals?.targetWeight ?? ''));
  return (
    <View style={styles.modal}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.modalTitle}>Body Stats</Text>
        <TouchableOpacity onPress={() => onSave({ currentWeight: parseFloat(cw), targetWeight: parseFloat(tw) })}>
          <Text style={[styles.modalSave, { color: accentColor }]}>Save</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.modalBody}>
        <Text style={styles.fieldLabel}>Current Weight (lbs)</Text>
        <TextInput style={styles.fieldInput} value={cw} onChangeText={setCw} keyboardType="decimal-pad" autoFocus placeholderTextColor={Colors.tertiaryLabel} />
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Target Weight (lbs)</Text>
        <TextInput style={styles.fieldInput} value={tw} onChangeText={setTw} keyboardType="decimal-pad" placeholderTextColor={Colors.tertiaryLabel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  signOutRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: AppLayout.screenMargin, paddingVertical: 8 },
  signOutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5' },
  signOutLabel: { fontSize: 12, fontWeight: '600', color: Colors.red },
  content: { padding: AppLayout.screenMargin, gap: 8, paddingBottom: 60 },
  profileCard: { ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  avatarEditBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  avatarEditIcon: { fontSize: 9, color: '#fff' },
  profileTap: { fontSize: 11, color: Colors.tertiaryLabel, marginTop: 3 },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },

  profileName: { fontSize: 17, fontWeight: '800', color: Colors.label },
  profileEmail: { fontSize: 12, color: Colors.secondaryLabel, marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', gap: 3, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 15, fontWeight: '900' },
  statLabel: { fontSize: 9, color: Colors.secondaryLabel, fontWeight: '600' },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: Colors.secondaryLabel, letterSpacing: 1, marginTop: 8, marginBottom: 2 },
  card: { ...cardStyle, padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  rowIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.label, fontWeight: '500' },
  rowValue: { fontSize: 13, color: Colors.secondaryLabel, maxWidth: 120 },
  rowChevron: { fontSize: 20, color: Colors.tertiaryLabel },
  version: { fontSize: 11, color: Colors.tertiaryLabel, textAlign: 'center', marginTop: 16, lineHeight: 20 },
  modal: { flex: 1, backgroundColor: '#FAFAFA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: AppLayout.screenMargin, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.label },
  modalCancel: { fontSize: 16, color: Colors.blue },
  modalSave: { fontSize: 16, fontWeight: '700' },
  modalBody: { padding: AppLayout.screenMargin },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondaryLabel, letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { borderBottomWidth: 1.5, borderBottomColor: Colors.separator, fontSize: 16, paddingBottom: 8, color: Colors.label },
  saveBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnLabel: { color: '#fff', fontWeight: '800', fontSize: 16 },



});
