import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDailyHistory, useWeeklyHistory, useMonthlyHistory } from '@/hooks/useHistory';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DailySummary } from '@/types';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

type Tab = 'day' | 'week' | 'month';

export default function HistoryScreen() {
  const [tab, setTab] = useState<Tab>('day');
  const [selectedDate] = useState(new Date());

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Historial</Text>

      <View style={styles.tabs}>
        {(['day', 'week', 'month'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'day' ? 'Día' : t === 'week' ? 'Semana' : 'Mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'day' && <DayView date={selectedDate} />}
      {tab === 'week' && <WeekView date={selectedDate} />}
      {tab === 'month' && <MonthView date={selectedDate} />}
    </SafeAreaView>
  );
}

const DayView: React.FC<{ date: Date }> = ({ date }) => {
  const { data, isLoading, isError, refetch } = useDailyHistory(date);
  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorMessage onRetry={refetch} />;

  return (
    <ScrollView style={styles.content}>
      <SummaryCard summary={data} />
      {data.meals.map((meal) => (
        <View key={meal.id} style={styles.mealRow}>
          <Text style={styles.mealTitle}>{meal.title}</Text>
          <Text style={styles.mealCal}>{meal.finalCalories} kcal</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const WeekView: React.FC<{ date: Date }> = ({ date }) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const { data, isLoading, isError, refetch } = useWeeklyHistory(weekStart);
  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorMessage onRetry={refetch} />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.date}
      renderItem={({ item }) => <DaySummaryRow summary={item} />}
      contentContainerStyle={styles.content}
    />
  );
};

const MonthView: React.FC<{ date: Date }> = ({ date }) => {
  const { data, isLoading, isError, refetch } = useMonthlyHistory(
    date.getFullYear(),
    date.getMonth() + 1
  );
  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorMessage onRetry={refetch} />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.date}
      renderItem={({ item }) => <DaySummaryRow summary={item} />}
      contentContainerStyle={styles.content}
    />
  );
};

const SummaryCard: React.FC<{ summary: DailySummary }> = ({ summary }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryDate}>
      {format(new Date(summary.date), "EEEE d 'de' MMMM", { locale: es })}
    </Text>
    <View style={styles.summaryMacros}>
      <MacroChip label="Cal" value={summary.totalCalories} unit="kcal" />
      <MacroChip label="P" value={summary.totalProteinG} unit="g" />
      <MacroChip label="C" value={summary.totalCarbsG} unit="g" />
      <MacroChip label="G" value={summary.totalFatG} unit="g" />
    </View>
  </View>
);

const DaySummaryRow: React.FC<{ summary: DailySummary }> = ({ summary }) => (
  <View style={styles.dayRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.dayLabel}>
        {format(new Date(summary.date), 'EEE d', { locale: es })}
      </Text>
      <Text style={styles.dayMeals}>{summary.meals.length} comidas</Text>
    </View>
    <Text style={styles.dayCal}>{summary.totalCalories} kcal</Text>
  </View>
);

const MacroChip: React.FC<{ label: string; value: number; unit: string }> = ({ label, value, unit }) => (
  <View style={styles.chip}>
    <Text style={styles.chipLabel}>{label}</Text>
    <Text style={styles.chipValue}>{value}{unit}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingBottom: 8 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#E8E8E8', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#4CAF50' },
  content: { padding: 16 },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryDate: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 12, textTransform: 'capitalize' },
  summaryMacros: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 8, alignItems: 'center' },
  chipLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  chipValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '700' },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 6,
  },
  mealTitle: { flex: 1, fontSize: 14, color: '#333' },
  mealCal: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  dayLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', textTransform: 'capitalize' },
  dayMeals: { fontSize: 12, color: '#888', marginTop: 2 },
  dayCal: { fontSize: 16, fontWeight: '700', color: '#4CAF50' },
});
