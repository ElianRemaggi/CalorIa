import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMeals, useCreateManualMeal, useCreatePhotoMeal, useDeleteMeal } from '@/hooks/useMeals';
import { MealItem } from '@/components/MealItem';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorMessage } from '@/components/ErrorMessage';
import { analyzeImage } from '@/services/ai';
import { useSettingsStore } from '@/store/settingsStore';
import { AIAnalysisResult } from '@/types';
import { format } from 'date-fns';

const manualSchema = z.object({
  title: z.string().min(1, 'Requerido').max(255),
  description: z.string().optional(),
  finalCalories: z.coerce.number().int().min(0).max(10000),
  finalProteinG: z.coerce.number().int().min(0).max(1000),
  finalCarbsG: z.coerce.number().int().min(0).max(1000),
  finalFatG: z.coerce.number().int().min(0).max(1000),
});
type ManualForm = z.infer<typeof manualSchema>;

export default function MealsScreen() {
  const today = new Date();
  const { data: meals, isLoading, isError, refetch } = useMeals(today);
  const createManual = useCreateManualMeal();
  const createPhoto = useCreatePhotoMeal();
  const deleteMealMutation = useDeleteMeal();
  const aiProvider = useSettingsStore((s) => s.aiProvider);

  const [showManualModal, setShowManualModal] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ManualForm>({
    resolver: zodResolver(manualSchema),
  });

  const handleManualSubmit = async (data: ManualForm) => {
    await createManual.mutateAsync({
      ...data,
      mealDateTime: new Date().toISOString(),
    });
    reset();
    setShowManualModal(false);
  };

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara o galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setAnalyzingPhoto(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const analysis = await analyzeImage(base64, aiProvider);
      setAiResult(analysis);
    } catch (error: any) {
      Alert.alert('Error al analizar', error.message, [
        { text: 'Cargar manualmente', onPress: () => setShowManualModal(true) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleConfirmAI = async (final: ManualForm) => {
    if (!aiResult) return;
    await createPhoto.mutateAsync({
      title: final.title,
      description: final.description,
      mealDateTime: new Date().toISOString(),
      estimatedCalories: aiResult.estimatedCalories,
      estimatedProteinG: aiResult.estimatedProteinG,
      estimatedCarbsG: aiResult.estimatedCarbsG,
      estimatedFatG: aiResult.estimatedFatG,
      finalCalories: final.finalCalories,
      finalProteinG: final.finalProteinG,
      finalCarbsG: final.finalCarbsG,
      finalFatG: final.finalFatG,
      aiProvider: aiResult.provider,
      aiDebug: {
        promptText: aiResult.promptText,
        rawResponse: aiResult.rawResponse,
        parsedResponse: {
          title: aiResult.title,
          description: aiResult.description,
          estimatedCalories: aiResult.estimatedCalories,
          estimatedProteinG: aiResult.estimatedProteinG,
          estimatedCarbsG: aiResult.estimatedCarbsG,
          estimatedFatG: aiResult.estimatedFatG,
        },
      },
    });
    setAiResult(null);
    reset();
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorMessage onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Comidas de hoy</Text>
        <Text style={styles.subtitle}>{format(today, 'dd/MM/yyyy')}</Text>
      </View>

      {analyzingPhoto && (
        <View style={styles.analyzing}>
          <ActivityIndicator color="#4CAF50" />
          <Text style={styles.analyzingText}>Analizando imagen con IA...</Text>
        </View>
      )}

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MealItem
            meal={item}
            onDelete={() => deleteMealMutation.mutate(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay comidas registradas hoy</Text>
        }
      />

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowManualModal(true)}>
          <Text style={styles.btnSecondaryText}>+ Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={handlePickPhoto}>
          <Text style={styles.btnPrimaryText}>📷 Por foto</Text>
        </TouchableOpacity>
      </View>

      {/* Manual meal modal */}
      <Modal visible={showManualModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 24 }}>
            <Text style={styles.modalTitle}>Registrar comida</Text>
            <MealForm control={control} errors={errors} />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => { setShowManualModal(false); reset(); }}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 1 }]}
                onPress={handleSubmit(handleManualSubmit)}
                disabled={createManual.isPending}
              >
                {createManual.isPending
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.btnPrimaryText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* AI result edit modal */}
      {aiResult && (
        <Modal visible animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView style={styles.modal} contentContainerStyle={{ padding: 24 }}>
              <Text style={styles.modalTitle}>Resultado IA</Text>
              <Text style={styles.aiProvider}>Proveedor: {aiResult.provider}</Text>
              {aiResult.warnings?.map((w, i) => (
                <Text key={i} style={styles.warning}>⚠️ {w}</Text>
              ))}
              <Text style={styles.aiHint}>Revisá y corregí los valores antes de guardar</Text>
              <AIResultForm
                aiResult={aiResult}
                control={control}
                errors={errors}
                onConfirm={handleSubmit(handleConfirmAI)}
                onCancel={() => { setAiResult(null); reset(); }}
                isPending={createPhoto.isPending}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const MealForm: React.FC<{ control: any; errors: any }> = ({ control, errors }) => (
  <View>
    {[
      { name: 'title', label: 'Nombre', placeholder: 'Ej: Ensalada de pollo', numeric: false },
      { name: 'finalCalories', label: 'Calorías (kcal)', placeholder: '0', numeric: true },
      { name: 'finalProteinG', label: 'Proteínas (g)', placeholder: '0', numeric: true },
      { name: 'finalCarbsG', label: 'Carbohidratos (g)', placeholder: '0', numeric: true },
      { name: 'finalFatG', label: 'Grasas (g)', placeholder: '0', numeric: true },
    ].map(({ name, label, placeholder, numeric }) => (
      <View key={name} style={{ marginBottom: 16 }}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Controller
          control={control}
          name={name as any}
          render={({ field: { value, onChange } }) => (
            <TextInput
              style={[styles.input, errors[name] && styles.inputError]}
              value={value?.toString() ?? ''}
              onChangeText={onChange}
              placeholder={placeholder}
              keyboardType={numeric ? 'numeric' : 'default'}
            />
          )}
        />
        {errors[name] && (
          <Text style={styles.errorText}>{(errors[name] as any)?.message}</Text>
        )}
      </View>
    ))}
  </View>
);

const AIResultForm: React.FC<{
  aiResult: AIAnalysisResult;
  control: any;
  errors: any;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ aiResult, control, errors, onConfirm, onCancel, isPending }) => {
  // Pre-fill form with AI values
  React.useEffect(() => {
    control._defaultValues = {
      title: aiResult.title,
      description: aiResult.description,
      finalCalories: aiResult.estimatedCalories,
      finalProteinG: aiResult.estimatedProteinG,
      finalCarbsG: aiResult.estimatedCarbsG,
      finalFatG: aiResult.estimatedFatG,
    };
  }, []);

  return (
    <View>
      <MealForm control={control} errors={errors} />
      <View style={styles.modalActions}>
        <TouchableOpacity style={styles.btnCancel} onPress={onCancel}>
          <Text style={styles.btnCancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, { flex: 1 }]}
          onPress={onConfirm}
          disabled={isPending}
        >
          {isPending
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.btnPrimaryText}>Guardar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 40 },
  analyzing: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: '#E8F5E9' },
  analyzingText: { color: '#388E3C', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, padding: 16 },
  btnPrimary: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  btnSecondary: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  btnSecondaryText: { color: '#4CAF50', fontWeight: '700', fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#F5F5F5' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },
  aiProvider: { fontSize: 13, color: '#888', marginBottom: 8 },
  aiHint: { fontSize: 13, color: '#555', marginBottom: 16, fontStyle: 'italic' },
  warning: { color: '#F57C00', fontSize: 13, marginBottom: 4 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 4 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  inputError: { borderColor: '#F44336' },
  errorText: { fontSize: 12, color: '#F44336', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnCancel: {
    borderWidth: 1.5,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  btnCancelText: { color: '#666', fontWeight: '600' },
});
