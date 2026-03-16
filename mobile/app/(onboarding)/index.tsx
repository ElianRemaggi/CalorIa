import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { upsertProfile } from '@/api/profile';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  gender: z.enum(['male', 'female', 'other']),
  age: z.coerce.number().int().min(10).max(120),
  heightCm: z.coerce.number().min(50).max(300),
  weightKg: z.coerce.number().min(20).max(500),
  goalType: z.enum(['lose', 'maintain', 'gain']),
});
type FormData = z.infer<typeof schema>;

const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

const GOALS = [
  { value: 'lose', label: 'Bajar peso' },
  { value: 'maintain', label: 'Mantener' },
  { value: 'gain', label: 'Subir peso' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'male', goalType: 'maintain' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await upsertProfile(data);
      // Update local user state
      if (user) {
        const { getToken } = await import('@/services/secureStorage');
        const token = await getToken();
        await setUser({ ...user, onboardingCompleted: true }, token!);
      }
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudo guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Cuéntanos sobre vos</Text>
        <Text style={styles.subtitle}>Para calcular tus metas nutricionales</Text>

        <Label text="Género" />
        <Controller
          control={control}
          name="gender"
          render={({ field: { value, onChange } }) => (
            <View style={styles.optionRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.option, value === g.value && styles.optionSelected]}
                  onPress={() => onChange(g.value)}
                >
                  <Text style={[styles.optionText, value === g.value && styles.optionTextSelected]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <Label text="Edad (años)" error={errors.age?.message} />
        <Controller
          control={control}
          name="age"
          render={({ field: { value, onChange } }) => (
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              keyboardType="numeric"
              value={value?.toString() ?? ''}
              onChangeText={onChange}
              placeholder="Ej: 28"
            />
          )}
        />

        <Label text="Altura (cm)" error={errors.heightCm?.message} />
        <Controller
          control={control}
          name="heightCm"
          render={({ field: { value, onChange } }) => (
            <TextInput
              style={[styles.input, errors.heightCm && styles.inputError]}
              keyboardType="numeric"
              value={value?.toString() ?? ''}
              onChangeText={onChange}
              placeholder="Ej: 175"
            />
          )}
        />

        <Label text="Peso actual (kg)" error={errors.weightKg?.message} />
        <Controller
          control={control}
          name="weightKg"
          render={({ field: { value, onChange } }) => (
            <TextInput
              style={[styles.input, errors.weightKg && styles.inputError]}
              keyboardType="numeric"
              value={value?.toString() ?? ''}
              onChangeText={onChange}
              placeholder="Ej: 75"
            />
          )}
        />

        <Label text="Objetivo" />
        <Controller
          control={control}
          name="goalType"
          render={({ field: { value, onChange } }) => (
            <View style={styles.optionRow}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.option, value === g.value && styles.optionSelected]}
                  onPress={() => onChange(g.value)}
                >
                  <Text style={[styles.optionText, value === g.value && styles.optionTextSelected]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Calcular mis metas</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Label: React.FC<{ text: string; error?: string }> = ({ text, error }) => (
  <View style={{ marginBottom: 4 }}>
    <Text style={styles.label}>{text}</Text>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 4 },
  errorText: { fontSize: 12, color: '#F44336' },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputError: { borderColor: '#F44336' },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  optionSelected: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
  optionText: { color: '#555', fontWeight: '500' },
  optionTextSelected: { color: '#4CAF50', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#4CAF50',
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
