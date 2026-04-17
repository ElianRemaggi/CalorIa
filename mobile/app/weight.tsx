import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useWeightLogs, useCreateWeightLog } from '@/hooks/useWeight';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorMessage } from '@/components/ErrorMessage';
import { WeightLogEntry } from '@/types';

export default function WeightScreen() {
  const router = useRouter();
  const { data: logs, isLoading, isError, refetch } = useWeightLogs();
  const createLog = useCreateWeightLog();

  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const kg = parseFloat(weightInput);
    if (isNaN(kg) || kg < 20 || kg > 500) {
      Alert.alert('Valor inválido', 'Ingresá un peso entre 20 y 500 kg');
      return;
    }
    setSaving(true);
    try {
      await createLog.mutateAsync({
        weightKg: kg,
        loggedAt: format(new Date(), 'yyyy-MM-dd'),
      });
      setWeightInput('');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el registro');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorMessage onRetry={refetch} />;

  const latest = logs?.[0];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Peso corporal</Text>
        </View>

        {/* Current weight card */}
        {latest && (
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Último registro</Text>
            <Text style={styles.currentWeight}>{latest.weightKg} kg</Text>
            <Text style={styles.currentDate}>
              {format(new Date(latest.loggedAt), "d 'de' MMMM yyyy", { locale: es })}
            </Text>
          </View>
        )}

        {/* Add entry */}
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Registrar peso de hoy</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="Ej: 75.5"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <Text style={styles.unit}>kg</Text>
            <TouchableOpacity
              style={[styles.addBtn, saving && styles.disabled]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.addBtnText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* History list */}
        <Text style={styles.historyLabel}>Historial</Text>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WeightRow entry={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay registros todavía</Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const WeightRow: React.FC<{ entry: WeightLogEntry }> = ({ entry }) => (
  <View style={styles.row}>
    <Text style={styles.rowDate}>
      {format(new Date(entry.loggedAt), "EEE d MMM", { locale: es })}
    </Text>
    <Text style={styles.rowWeight}>{entry.weightKg} kg</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, paddingBottom: 8 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  currentCard: {
    margin: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  currentLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  currentWeight: { fontSize: 48, fontWeight: '700', color: '#FFF' },
  currentDate: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, textTransform: 'capitalize' },
  addCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  addTitle: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  unit: { fontSize: 16, color: '#888', fontWeight: '600' },
  addBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 },
  historyLabel: { fontSize: 13, fontWeight: '700', color: '#888', paddingHorizontal: 20, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  rowDate: { fontSize: 14, color: '#555', textTransform: 'capitalize' },
  rowWeight: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
});
