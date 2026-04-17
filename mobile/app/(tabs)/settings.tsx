import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationSettings, updateNotificationSettings } from '@/api/notifications';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getApiKey, saveApiKey } from '@/services/secureStorage';
import { AIProvider, NotificationPreferences } from '@/types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI (GPT-4o)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'claude', label: 'Anthropic Claude' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);
  const { aiProvider, setAiProvider } = useSettingsStore();
  const queryClient = useQueryClient();

  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    openai: '', gemini: '', claude: '',
  });
  const [savingKey, setSavingKey] = useState<AIProvider | null>(null);

  const { data: notifSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: getNotificationSettings,
  });

  const updateNotif = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-settings'] }),
  });

  useEffect(() => {
    (['openai', 'gemini', 'claude'] as AIProvider[]).forEach(async (p) => {
      const key = await getApiKey(p);
      if (key) setApiKeys((prev) => ({ ...prev, [p]: key }));
    });
  }, []);

  const handleSaveKey = async (provider: AIProvider) => {
    setSavingKey(provider);
    try {
      await saveApiKey(provider, apiKeys[provider]);
      Alert.alert('Guardado', `API key de ${provider} guardada correctamente`);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la API key');
    } finally {
      setSavingKey(null);
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

  const toggleNotif = (key: keyof NotificationPreferences, value: boolean | number) => {
    if (!notifSettings) return;
    updateNotif.mutate({ ...notifSettings, [key]: value });
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
              <Text style={[styles.providerLabel, aiProvider === p.value && styles.providerLabelSelected]}>
                {p.label}
              </Text>
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
          <NotifToggle
            label="Recordatorio desayuno"
            value={notifSettings?.breakfastReminderEnabled ?? false}
            onToggle={(v) => toggleNotif('breakfastReminderEnabled', v)}
          />
          <NotifToggle
            label="Recordatorio almuerzo"
            value={notifSettings?.lunchReminderEnabled ?? false}
            onToggle={(v) => toggleNotif('lunchReminderEnabled', v)}
          />
          <NotifToggle
            label="Recordatorio cena"
            value={notifSettings?.dinnerReminderEnabled ?? false}
            onToggle={(v) => toggleNotif('dinnerReminderEnabled', v)}
          />
          <NotifToggle
            label="Recordatorio merienda"
            value={notifSettings?.snackReminderEnabled ?? false}
            onToggle={(v) => toggleNotif('snackReminderEnabled', v)}
          />
        </Section>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  checkmark: { color: '#4CAF50', fontSize: 18, fontWeight: '700' },
  hint: { fontSize: 12, color: '#999', padding: 12, fontStyle: 'italic' },
  keyRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  keyLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  keyInput: { flexDirection: 'row', gap: 8 },
  keyField: { flex: 1, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  toggleLabel: { fontSize: 15, color: '#333' },
  logoutBtn: { margin: 20, padding: 16, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#F44336' },
  logoutText: { color: '#F44336', fontWeight: '700', fontSize: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navLabel: { fontSize: 15, color: '#333' },
  navArrow: { fontSize: 20, color: '#CCC', fontWeight: '300' },
});
