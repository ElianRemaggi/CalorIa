import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface Props {
  message?: string;
}

export const LoadingScreen: React.FC<Props> = ({ message }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#4CAF50" />
    {message && <Text style={styles.text}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  text: { marginTop: 12, color: '#666', fontSize: 14 },
});
