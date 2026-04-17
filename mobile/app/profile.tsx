import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useAuthStore } from '@/store/authStore';
import { getToken } from '@/services/secureStorage';

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

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profile
      ? {
          gender: profile.gender,
          age: profile.age,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          goalType: profile.goalType,
        }
      : undefined,
  });

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile.mutateAsync(data);
      if (user) {
        const token = await getToken();
        await setUser({ ...user, onboardingCompleted: true }, token!);
      }
      Alert.alert('Guardado', 'Tu perfil fue actualizado');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudo guardar el perfil');
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorMessage onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>‹ Volver</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Mi perfil</Text>
          <Text style={styles.subtitle}>Actualizá tus datos para recalcular tus metas</Text>

          {/* Metas actuales */}
          {profile && (
            <View style={styles.targetsCard}>
              <Text style={styles.targetsTitle}>Metas actuales</Text>
              <View style={styles.targetsRow}>
                <TargetChip label="Calorías" value={`${profile.targetCalories} kcal`} />
                <TargetChip label="Proteínas" value={`${profile.targetProteinG}g`} />
                <TargetChip label="Carbos" value={`${profile.targetCarbsG}g`} />
                <TargetChip label="Grasas" value={`${profile.targetFatG}g`} />
              </View>
            </View>
          )}

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
            style={[styles.submitBtn, updateProfile.isPending && styles.disabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.submitText}>Guardar cambios</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Label: React.FC<{ text: string; error?: string }> = ({ text, error }) => (
  <View style={{ marginBottom: 4 }}>
    <Text style={styles.label}>{text}</Text>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const TargetChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.targetChip}>
    <Text style={styles.targetChipLabel}>{label}</Text>
    <Text style={styles.targetChipValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  headerRow: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  targetsCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  targetsTitle: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  targetsRow: { flexDirection: 'row', gap: 8 },
  targetChip: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 8, alignItems: 'center' },
  targetChipLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  targetChipValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '700', marginTop: 2 },
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
