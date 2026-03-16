import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { googleAuth } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  offlineAccess: false,
});

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No se obtuvo el token de Google');

      const authResponse = await googleAuth(idToken);
      await setUser(authResponse.user, authResponse.accessToken);

      if (authResponse.user.onboardingCompleted) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(onboarding)');
      }
    } catch (error: any) {
      Alert.alert('Error al iniciar sesión', error.message ?? 'Intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🥗</Text>
        <Text style={styles.appName}>CalorIA</Text>
        <Text style={styles.subtitle}>Tu asistente de nutrición con IA</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.disabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.googleBtnText}>Continuar con Google</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          Al continuar aceptas que tus datos nutricionales se almacenan en nuestros servidores.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'space-between', padding: 32 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 72, marginBottom: 16 },
  appName: { fontSize: 40, fontWeight: '700', color: '#4CAF50' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, textAlign: 'center' },
  bottom: { gap: 16 },
  googleBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  googleBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
});
