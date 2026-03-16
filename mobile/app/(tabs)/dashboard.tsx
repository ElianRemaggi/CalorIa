import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';
import { MacroProgressBar } from '@/components/MacroProgressBar';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorMessage } from '@/components/ErrorMessage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const today = new Date();
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard(today);

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorMessage onRetry={refetch} />;

  const dateLabel = format(today, "EEEE d 'de' MMMM", { locale: es });
  const calProgress = data.targetCalories > 0
    ? Math.min(data.consumedCalories / data.targetCalories, 1)
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.fullName?.split(' ')[0]} 👋</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
        </View>

        {/* Calorie ring */}
        <View style={styles.calorieCard}>
          <Text style={styles.calorieLabel}>Calorías</Text>
          <Text style={styles.calorieMain}>
            <Text style={styles.calorieConsumed}>{data.consumedCalories}</Text>
            <Text style={styles.calorieOf}> / {data.targetCalories} kcal</Text>
          </Text>
          <View style={styles.calorieTrack}>
            <View
              style={[
                styles.calorieFill,
                {
                  width: `${calProgress * 100}%`,
                  backgroundColor: calProgress >= 1 ? '#F44336' : '#4CAF50',
                },
              ]}
            />
          </View>
          <Text style={styles.calorieRemaining}>
            {data.remainingCalories >= 0
              ? `${data.remainingCalories} kcal restantes`
              : `${Math.abs(data.remainingCalories)} kcal por encima`}
          </Text>
        </View>

        {/* Macros */}
        <View style={styles.macrosCard}>
          <Text style={styles.sectionTitle}>Macronutrientes</Text>
          <MacroProgressBar
            label="Proteínas"
            consumed={data.consumedProteinG}
            target={data.targetProteinG}
            color="#4CAF50"
          />
          <MacroProgressBar
            label="Carbohidratos"
            consumed={data.consumedCarbsG}
            target={data.targetCarbsG}
            color="#2196F3"
          />
          <MacroProgressBar
            label="Grasas"
            consumed={data.consumedFatG}
            target={data.targetFatG}
            color="#FF9800"
          />
        </View>

        {/* FAB area */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/meals')}
      >
        <Text style={styles.fabText}>+ Registrar comida</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  date: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  calorieCard: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  calorieLabel: { fontSize: 13, color: '#888', marginBottom: 8 },
  calorieMain: { marginBottom: 12 },
  calorieConsumed: { fontSize: 36, fontWeight: '700', color: '#1A1A1A' },
  calorieOf: { fontSize: 18, color: '#888' },
  calorieTrack: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  calorieFill: { height: '100%', borderRadius: 6 },
  calorieRemaining: { fontSize: 13, color: '#666' },
  macrosCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
