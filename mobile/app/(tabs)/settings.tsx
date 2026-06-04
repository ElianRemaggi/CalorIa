import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList,
  TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationSettings, updateNotificationSettings } from '@/api/notifications';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore, MealReminderKey } from '@/store/settingsStore';
import { getApiKey, saveApiKey } from '@/services/secureStorage';
import { fetchModels, ModelOption } from '@/services/ai/modelFetcher';
import { AIProvider, NotificationPreferences } from '@/types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  requestNotificationPermissions,
  scheduleReminder,
  cancelReminder,
  parseTime,
} from '@/services/notifications';

const REMINDER_TIMES: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI (GPT-4o)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'claude', label: 'Anthropic Claude' },
  { value: 'deepseek', label: 'DeepSeek' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);
  const { aiProvider, setAiProvider, selectedModels, setSelectedModel, reminderTimes, setReminderTime } = useSettingsStore();
  const queryClient = useQueryClient();
  const [timePicker, setTimePicker] = useState<MealReminderKey | null>(null);

  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    openai: '', gemini: '', claude: '', deepseek: '',
  });
  const [savingKey, setSavingKey] = useState<AIProvider | null>(null);
  const [verifying, setVerifying] = useState<AIProvider | null>(null);
  const [availableModels, setAvailableModels] = useState<Partial<Record<AIProvider, ModelOption[]>>>({});

  const { data: notifSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: getNotificationSettings,
  });

  const updateNotif = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-settings'] }),
  });

  useEffect(() => {
    (['openai', 'gemini', 'claude', 'deepseek'] as AIProvider[]).forEach(async (p) => {
      const key = await getApiKey(p);
      if (key) setApiKeys((prev) => ({ ...prev, [p]: key }));
    });
  }, []);

  const handleSaveKey = async (provider: AIProvider) => {
    setSavingKey(provider);
    try {
      await saveApiKey(provider, apiKeys[provider]);
      setAvailableModels((prev) => ({ ...prev, [provider]: undefined }));
      Alert.alert('Guardado', `API key de ${provider} guardada correctamente`);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la API key');
    } finally {
      setSavingKey(null);
    }
  };

  const handleVerifyModels = async (provider: AIProvider) => {
    const key = apiKeys[provider];
    if (!key) {
      Alert.alert('Sin API key', 'Guardá la API key primero');
      return;
    }
    setVerifying(provider);
    try {
      const models = await fetchModels(provider, key);
      if (models.length === 0) {
        Alert.alert('Sin modelos', 'No se encontraron modelos disponibles para esta key');
        return;
      }
      setAvailableModels((prev) => ({ ...prev, [provider]: models }));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo obtener la lista de modelos');
    } finally {
      setVerifying(null);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try { await GoogleSignin.signOut(); } catch {}
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const toggleNotif = async (key: keyof NotificationPreferences, value: boolean | number) => {
    if (!notifSettings) return;
    updateNotif.mutate({ ...notifSettings, [key]: value });

    const reminderMap: Partial<Record<keyof NotificationPreferences, MealReminderKey>> = {
      breakfastReminderEnabled: 'breakfast',
      lunchReminderEnabled: 'lunch',
      dinnerReminderEnabled: 'dinner',
      snackReminderEnabled: 'snack',
    };
    const mealType = reminderMap[key];
    if (!mealType) return;

    if (value === true) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Habilitá las notificaciones en los ajustes del sistema.');
        return;
      }
      const { hour, minute } = parseTime(reminderTimes[mealType]);
      await scheduleReminder(mealType, hour, minute);
    } else {
      await cancelReminder(mealType as any);
    }
  };

  const handleTimeChange = async (mealType: MealReminderKey, time: string) => {
    await setReminderTime(mealType, time);
    setTimePicker(null);
    if (notifSettings?.[`${mealType}ReminderEnabled` as keyof NotificationPreferences]) {
      const { hour, minute } = parseTime(time);
      await scheduleReminder(mealType, hour, minute);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        <Text style={styles.screenTitle}>Ajustes</Text>

        {/* User info */}
        <Section title="Cuenta">
          <View style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.fullName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/profile')}>
            <Text style={styles.navLabel}>Editar perfil nutricional</Text>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/weight')}>
            <Text style={styles.navLabel}>Historial de peso</Text>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </Section>

        {/* AI Provider */}
        <Section title="Proveedor de IA">
          {AI_PROVIDERS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.providerRow, aiProvider === p.value && styles.providerSelected]}
              onPress={() => setAiProvider(p.value)}
            >
              <View>
                <Text style={[styles.providerLabel, aiProvider === p.value && styles.providerLabelSelected]}>
                  {p.label}
                </Text>
                <Text style={styles.modelSubtitle}>{selectedModels[p.value]}</Text>
              </View>
              {aiProvider === p.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Section>

        {/* API Keys */}
        <Section title="API Keys">
          <Text style={styles.hint}>Las API keys se guardan solo en tu dispositivo</Text>
          {AI_PROVIDERS.map((p) => (
            <View key={p.value} style={styles.keyRow}>
              <Text style={styles.keyLabel}>{p.label}</Text>
              <View style={styles.keyInput}>
                <TextInput
                  style={styles.keyField}
                  value={apiKeys[p.value]}
                  onChangeText={(v) => setApiKeys((prev) => ({ ...prev, [p.value]: v }))}
                  placeholder="sk-..."
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => handleSaveKey(p.value)}
                  disabled={savingKey === p.value}
                >
                  {savingKey === p.value
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={styles.saveBtnText}>Guardar</Text>}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => handleVerifyModels(p.value)}
                disabled={verifying === p.value || !apiKeys[p.value]}
              >
                {verifying === p.value
                  ? <ActivityIndicator size="small" color="#1565C0" />
                  : <Text style={[styles.verifyBtnText, !apiKeys[p.value] && styles.verifyBtnDisabled]}>
                      Verificar modelos disponibles
                    </Text>}
              </TouchableOpacity>

              {availableModels[p.value] && (
                <View style={styles.modelList}>
                  {availableModels[p.value]!.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.modelChip,
                        selectedModels[p.value] === m.id && styles.modelChipSelected,
                      ]}
                      onPress={() => setSelectedModel(p.value, m.id)}
                    >
                      <Text style={[
                        styles.modelChipText,
                        selectedModels[p.value] === m.id && styles.modelChipTextSelected,
                      ]}>
                        {m.displayName}
                      </Text>
                      {selectedModels[p.value] === m.id && (
                        <Text style={styles.modelChipCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Section>

        {/* Notifications */}
        <Section title="Notificaciones">
          <NotifToggle
            label="Activar notificaciones"
            value={notifSettings?.enabled ?? false}
            onToggle={(v) => toggleNotif('enabled', v)}
          />
          {(
            [
              { key: 'breakfastReminderEnabled', label: 'Desayuno', type: 'breakfast' },
              { key: 'lunchReminderEnabled', label: 'Almuerzo', type: 'lunch' },
              { key: 'dinnerReminderEnabled', label: 'Cena', type: 'dinner' },
              { key: 'snackReminderEnabled', label: 'Merienda', type: 'snack' },
            ] as { key: keyof NotificationPreferences; label: string; type: MealReminderKey }[]
          ).map(({ key, label, type }) => (
            <View key={key} style={styles.notifRow}>
              <NotifToggle
                label={label}
                value={(notifSettings?.[key] as boolean) ?? false}
                onToggle={(v) => toggleNotif(key, v)}
              />
              {(notifSettings?.[key] as boolean) && (
                <TouchableOpacity style={styles.timeChip} onPress={() => setTimePicker(type)}>
                  <Text style={styles.timeChipText}>{reminderTimes[type]}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Section>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Time picker modal */}
      <Modal visible={!!timePicker} transparent animationType="slide" onRequestClose={() => setTimePicker(null)}>
        <View style={styles.timeOverlay}>
          <View style={styles.timeSheet}>
            <Text style={styles.timeSheetTitle}>Hora del recordatorio</Text>
            <FlatList
              data={REMINDER_TIMES}
              keyExtractor={(t) => t}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.timeOption, timePicker && reminderTimes[timePicker] === item && styles.timeOptionSelected]}
                  onPress={() => timePicker && handleTimeChange(timePicker, item)}
                >
                  <Text style={[styles.timeOptionText, timePicker && reminderTimes[timePicker] === item && styles.timeOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.timeCancelBtn} onPress={() => setTimePicker(null)}>
              <Text style={styles.timeCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const NotifToggle: React.FC<{
  label: string; value: boolean; onToggle: (v: boolean) => void;
}> = ({ label, value, onToggle }) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ true: '#4CAF50' }}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingBottom: 8 },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', paddingHorizontal: 20, paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 1 },
  sectionBody: { backgroundColor: '#FFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EEE' },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  userEmail: { fontSize: 13, color: '#888' },
  providerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  providerSelected: { backgroundColor: '#F1F8E9' },
  providerLabel: { fontSize: 15, color: '#333' },
  providerLabelSelected: { color: '#4CAF50', fontWeight: '600' },
  modelSubtitle: { fontSize: 11, color: '#AAA', marginTop: 2 },
  checkmark: { color: '#4CAF50', fontSize: 18, fontWeight: '700' },
  hint: { fontSize: 12, color: '#999', padding: 12, fontStyle: 'italic' },
  keyRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  keyLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  keyInput: { flexDirection: 'row', gap: 8 },
  keyField: { flex: 1, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  verifyBtn: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  verifyBtnText: { color: '#1565C0', fontSize: 13, fontWeight: '600' },
  verifyBtnDisabled: { color: '#BBB' },
  modelList: { marginTop: 10, gap: 6 },
  modelChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FAFAFA' },
  modelChipSelected: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  modelChipText: { fontSize: 13, color: '#444', flex: 1 },
  modelChipTextSelected: { color: '#2E7D32', fontWeight: '600' },
  modelChipCheck: { color: '#4CAF50', fontWeight: '700', marginLeft: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  toggleLabel: { fontSize: 15, color: '#333' },
  logoutBtn: { margin: 20, padding: 16, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#F44336' },
  logoutText: { color: '#F44336', fontWeight: '700', fontSize: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navLabel: { fontSize: 15, color: '#333' },
  navArrow: { fontSize: 20, color: '#CCC', fontWeight: '300' },
  notifRow: {},
  timeChip: { marginHorizontal: 16, marginBottom: 10, alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  timeChipText: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  timeOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  timeSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  timeSheetTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 16, textAlign: 'center' },
  timeOption: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, marginBottom: 4 },
  timeOptionSelected: { backgroundColor: '#E8F5E9' },
  timeOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  timeOptionTextSelected: { color: '#2E7D32', fontWeight: '700' },
  timeCancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  timeCancelText: { color: '#888', fontSize: 15 },
});
