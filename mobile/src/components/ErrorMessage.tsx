import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<Props> = ({
  message = 'Ocurrió un error. Intenta de nuevo.',
  onRetry,
}) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message}</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Reintentar</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { color: '#F44336', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '600' },
});
