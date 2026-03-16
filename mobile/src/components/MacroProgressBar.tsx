import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  consumed: number;
  target: number;
  color: string;
  unit?: string;
}

export const MacroProgressBar: React.FC<Props> = ({
  label,
  consumed,
  target,
  color,
  unit = 'g',
}) => {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {consumed}{unit} / {target}{unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  values: { fontSize: 13, color: '#888' },
  track: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});
