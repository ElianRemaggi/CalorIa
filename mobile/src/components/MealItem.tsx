import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MealEntry } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  meal: MealEntry;
  onDelete: () => void;
  onEdit?: () => void;
}

export const MealItem: React.FC<Props> = ({ meal, onDelete, onEdit }) => {
  const time = format(new Date(meal.mealDatetime), 'HH:mm', { locale: es });

  const handleDelete = () => {
    Alert.alert('Eliminar comida', `¿Eliminar "${meal.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{meal.title}</Text>
          <View style={[styles.badge, meal.sourceType === 'photo' ? styles.badgeIA : styles.badgeManual]}>
            <Text style={styles.badgeText}>{meal.sourceType === 'photo' ? 'IA' : 'Manual'}</Text>
          </View>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>

      <View style={styles.macros}>
        <MacroChip label="Cal" value={meal.finalCalories} unit="kcal" color="#FF6B35" />
        <MacroChip label="P" value={meal.finalProteinG} unit="g" color="#4CAF50" />
        <MacroChip label="C" value={meal.finalCarbsG} unit="g" color="#2196F3" />
        <MacroChip label="G" value={meal.finalFatG} unit="g" color="#FF9800" />
      </View>

      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Text style={styles.actionEdit}>Editar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
          <Text style={styles.actionDelete}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MacroChip: React.FC<{ label: string; value: number; unit: string; color: string }> = ({
  label, value, unit, color,
}) => (
  <View style={[styles.chip, { borderColor: color }]}>
    <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    <Text style={styles.chipValue}>{value}{unit}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  time: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeIA: { backgroundColor: '#E3F2FD' },
  badgeManual: { backgroundColor: '#F1F8E9' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#555' },
  macros: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chipLabel: { fontSize: 10, fontWeight: '700' },
  chipValue: { fontSize: 12, color: '#333' },
  actions: { flexDirection: 'row', gap: 16, justifyContent: 'flex-end' },
  actionBtn: { paddingVertical: 4 },
  actionEdit: { color: '#2196F3', fontSize: 13 },
  actionDelete: { color: '#F44336', fontSize: 13 },
});
