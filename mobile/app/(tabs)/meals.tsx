import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMeals, useCreateManualMeal, useCreatePhotoMeal, useDeleteMeal } from '@/hooks/useMeals';
import { MealItem } from '@/components/MealItem';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorMessage } from '@/components/ErrorMessage';
import { analyzeImage, analyzeText } from '@/services/ai';
import { useSettingsStore } from '@/store/settingsStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { AIAnalysisResult, UsdaFoodItem, FavoriteMeal } from '@/types';
import { searchUsda } from '@/api/usda';
import { lookupBarcode } from '@/api/openFoodFacts';
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
  const [usdaResults, setUsdaResults] = useState<UsdaFoodItem[]>([]);
  const [selectedUsdaItem, setSelectedUsdaItem] = useState<UsdaFoodItem | null>(null);
  const [searchingUsda, setSearchingUsda] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{ uri: string; mimeType: string } | null>(null);
  const [userNote, setUserNote] = useState('');
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');
  const [analyzingText, setAnalyzingText] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const barcodeCooldown = useRef(false);

  const { favorites, loadFromStorage: loadFavorites, addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => { loadFavorites(); }, []);

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

    const { uri, mimeType: assetMime } = result.assets[0];
    setPendingPhoto({ uri, mimeType: assetMime ?? 'image/jpeg' });
    setUserNote('');
  };

  const handleAnalyzeWithNote = async () => {
    if (!pendingPhoto) return;
    const { uri, mimeType } = pendingPhoto;
    setPendingPhoto(null);
    setAnalyzingPhoto(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const analysis = await analyzeImage(base64, aiProvider, mimeType, userNote || undefined);
      setAiResult(analysis);
      setSearchingUsda(true);
      searchUsda(analysis.title)
        .then((res) => setUsdaResults(res.foods))
        .catch(() => setUsdaResults([]))
        .finally(() => setSearchingUsda(false));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error al analizar', message, [
        { text: 'Cargar manualmente', onPress: () => setShowManualModal(true) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleAnalyzeDescription = async () => {
    const trimmed = descriptionText.trim();
    if (!trimmed) return;
    setShowDescribeModal(false);
    setAnalyzingText(true);
    try {
      const analysis = await analyzeText(trimmed, aiProvider);
      setAiResult(analysis);
      setSearchingUsda(true);
      searchUsda(analysis.title)
        .then((res) => setUsdaResults(res.foods))
        .catch(() => setUsdaResults([]))
        .finally(() => setSearchingUsda(false));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error al analizar', message, [
        { text: 'Cargar manualmente', onPress: () => setShowManualModal(true) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } finally {
      setAnalyzingText(false);
      setDescriptionText('');
    }
  };

  const handleOpenBarcode = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear.');
        return;
      }
    }
    barcodeCooldown.current = false;
    setShowBarcode(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (barcodeCooldown.current) return;
    barcodeCooldown.current = true;
    setShowBarcode(false);
    setScanningBarcode(true);
    try {
      const result = await lookupBarcode(data);
      if (!result.found) {
        Alert.alert('Producto no encontrado', 'No se encontró el código en OpenFoodFacts. Podés cargarlo manualmente.', [
          { text: 'Cargar manualmente', onPress: () => setShowManualModal(true) },
          { text: 'Cancelar', style: 'cancel' },
        ]);
        return;
      }
      const label = result.brand ? `${result.title} (${result.brand})` : result.title;
      const cal100 = result.calories100g ?? 0;
      const prot100 = result.protein100g ?? 0;
      const carb100 = result.carbs100g ?? 0;
      const fat100 = result.fat100g ?? 0;
      const hint = result.servingSize ? `Porción sugerida: ${result.servingSize}` : 'Valores por 100g. Ajustá la cantidad.';
      Alert.alert(label, hint, [
        {
          text: 'Agregar (100g)',
          onPress: async () => {
            await createManual.mutateAsync({
              title: label,
              mealDateTime: new Date().toISOString(),
              finalCalories: Math.round(cal100),
              finalProteinG: Math.round(prot100),
              finalCarbsG: Math.round(carb100),
              finalFatG: Math.round(fat100),
            });
          },
        },
        { text: 'Editar antes de guardar', onPress: () => setShowManualModal(true) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo consultar OpenFoodFacts. Revisá tu conexión.');
    } finally {
      setScanningBarcode(false);
    }
  };

  const handleToggleFavorite = (meal: FavoriteMeal) => {
    if (isFavorite(meal.id)) {
      removeFavorite(meal.id);
    } else {
      addFavorite(meal);
    }
  };

  const handleQuickAddFavorite = async (fav: FavoriteMeal) => {
    await createManual.mutateAsync({
      title: fav.title,
      description: fav.description,
      mealDateTime: new Date().toISOString(),
      finalCalories: fav.finalCalories,
      finalProteinG: fav.finalProteinG,
      finalCarbsG: fav.finalCarbsG,
      finalFatG: fav.finalFatG,
    });
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
      usdaFdcId: selectedUsdaItem?.fdcId,
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
    setUsdaResults([]);
    setSelectedUsdaItem(null);
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

      {(analyzingPhoto || analyzingText || scanningBarcode) && (
        <View style={styles.analyzing}>
          <ActivityIndicator color="#4CAF50" />
          <Text style={styles.analyzingText}>
            {scanningBarcode ? 'Buscando producto...' : analyzingText ? 'Estimando calorías con IA...' : 'Analizando imagen con IA...'}
          </Text>
        </View>
      )}

      {/* Favorites quick-add strip */}
      {favorites.length > 0 && (
        <View style={styles.favSection}>
          <Text style={styles.favTitle}>Favoritos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favList}>
            {favorites.map((fav) => (
              <TouchableOpacity key={fav.id} style={styles.favCard} onPress={() => handleQuickAddFavorite(fav)}>
                <Text style={styles.favCardTitle} numberOfLines={2}>{fav.title}</Text>
                <Text style={styles.favCardCal}>{fav.finalCalories} kcal</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MealItem
            meal={item}
            onDelete={() => deleteMealMutation.mutate(item.id)}
            isFavorite={isFavorite(item.id)}
            onFavorite={() => handleToggleFavorite({
              id: item.id,
              title: item.title,
              description: item.description,
              finalCalories: item.finalCalories,
              finalProteinG: item.finalProteinG,
              finalCarbsG: item.finalCarbsG,
              finalFatG: item.finalFatG,
              savedAt: new Date().toISOString(),
            })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay comidas registradas hoy</Text>
        }
      />

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handlePickPhoto}>
          <Text style={styles.btnPrimaryText}>Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSecondary, { flex: 1 }]} onPress={handleOpenBarcode}>
          <Text style={styles.btnSecondaryText}>Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSecondary, { flex: 1 }]} onPress={() => { setDescriptionText(''); setShowDescribeModal(true); }}>
          <Text style={styles.btnSecondaryText}>Describir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowManualModal(true)}>
          <Text style={styles.btnSecondaryText}>Manual</Text>
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

      {/* Photo note modal */}
      <Modal visible={!!pendingPhoto} animationType="slide" presentationStyle="pageSheet" transparent>
        <KeyboardAvoidingView
          style={styles.noteOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.noteSheet}>
            <Text style={styles.noteTitle}>Agregar contexto (opcional)</Text>
            <Text style={styles.noteHint}>
              Describí el plato con más detalle: relleno, ingredientes no visibles, tamaño de porción, etc.
            </Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={userNote}
              onChangeText={setUserNote}
              placeholder="Ej: empanadas de carne con aceitunas y huevo duro, 3 unidades"
              placeholderTextColor="#AAA"
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => { setPendingPhoto(null); setUserNote(''); }}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 1 }]}
                onPress={handleAnalyzeWithNote}
              >
                <Text style={styles.btnPrimaryText}>Analizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Describe meal modal */}
      <Modal visible={showDescribeModal} animationType="slide" presentationStyle="pageSheet" transparent>
        <KeyboardAvoidingView
          style={styles.noteOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.noteSheet}>
            <Text style={styles.noteTitle}>Describir comida</Text>
            <Text style={styles.noteHint}>
              Describí lo que comiste y la IA estimará las calorías y macros. Incluí cantidades y preparación para mayor precisión.
            </Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={descriptionText}
              onChangeText={setDescriptionText}
              placeholder="Ej: 2 milanesas de pollo con puré de papas, vaso de jugo de naranja"
              placeholderTextColor="#AAA"
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => { setShowDescribeModal(false); setDescriptionText(''); }}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 1, opacity: descriptionText.trim() ? 1 : 0.5 }]}
                onPress={handleAnalyzeDescription}
                disabled={!descriptionText.trim()}
              >
                <Text style={styles.btnPrimaryText}>Estimar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barcode scanner modal */}
      <Modal visible={showBarcode} animationType="slide" onRequestClose={() => setShowBarcode(false)}>
        <View style={styles.barcodeContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.barcodeOverlay}>
            <View style={styles.barcodeFrame} />
            <Text style={styles.barcodeHint}>Apuntá al código de barras del producto</Text>
          </View>
          <TouchableOpacity style={styles.barcodeClose} onPress={() => setShowBarcode(false)}>
            <Text style={styles.barcodeCloseText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
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
                <Text key={i} style={styles.warning}>{w}</Text>
              ))}
              <Text style={styles.aiHint}>Revisá y corregí los valores antes de guardar</Text>

              {/* USDA comparison */}
              {searchingUsda && (
                <View style={[styles.usdaSection, { flexDirection: 'row', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.usdaLabel}>Buscando en base USDA...</Text>
                </View>
              )}
              {!searchingUsda && usdaResults.length > 0 && (
                <View style={styles.usdaSection}>
                  <Text style={styles.usdaSectionTitle}>Coincidencias USDA (por 100g)</Text>
                  {usdaResults.slice(0, 3).map((item) => {
                    const isSelected = selectedUsdaItem?.fdcId === item.fdcId;
                    return (
                      <TouchableOpacity
                        key={item.fdcId}
                        style={[styles.usdaItem, isSelected && styles.usdaItemSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedUsdaItem(null);
                          } else {
                            setSelectedUsdaItem(item);
                            // Pre-fill form with USDA values
                            reset({
                              title: aiResult.title,
                              description: aiResult.description ?? '',
                              finalCalories: item.calories ?? aiResult.estimatedCalories,
                              finalProteinG: item.proteinG ?? aiResult.estimatedProteinG,
                              finalCarbsG: item.carbsG ?? aiResult.estimatedCarbsG,
                              finalFatG: item.fatG ?? aiResult.estimatedFatG,
                            });
                          }
                        }}
                      >
                        <Text style={styles.usdaItemName} numberOfLines={1}>{item.description}</Text>
                        <Text style={styles.usdaItemMacros}>
                          {item.calories ?? '?'} kcal · P {item.proteinG ?? '?'}g · C {item.carbsG ?? '?'}g · G {item.fatG ?? '?'}g
                        </Text>
                        {isSelected && <Text style={styles.usdaItemBadge}>Seleccionado</Text>}
                      </TouchableOpacity>
                    );
                  })}
                  {selectedUsdaItem && (
                    <TouchableOpacity onPress={() => {
                      setSelectedUsdaItem(null);
                      reset({
                        title: aiResult.title,
                        description: aiResult.description ?? '',
                        finalCalories: aiResult.estimatedCalories,
                        finalProteinG: aiResult.estimatedProteinG,
                        finalCarbsG: aiResult.estimatedCarbsG,
                        finalFatG: aiResult.estimatedFatG,
                      });
                    }}>
                      <Text style={styles.usdaReset}>Volver a valores IA</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <AIResultForm
                aiResult={aiResult}
                control={control}
                errors={errors}
                reset={reset}
                onConfirm={handleSubmit(handleConfirmAI)}
                onCancel={() => { setAiResult(null); setUsdaResults([]); setSelectedUsdaItem(null); reset(); }}
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
  reset: (values: ManualForm) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ aiResult, control, errors, reset, onConfirm, onCancel, isPending }) => {
  useEffect(() => {
    reset({
      title: aiResult.title,
      description: aiResult.description ?? '',
      finalCalories: aiResult.estimatedCalories,
      finalProteinG: aiResult.estimatedProteinG,
      finalCarbsG: aiResult.estimatedCarbsG,
      finalFatG: aiResult.estimatedFatG,
    });
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
  usdaSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  usdaLabel: { color: '#555', fontSize: 13, marginLeft: 8 },
  usdaSectionTitle: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  usdaItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  usdaItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  usdaItemName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  usdaItemMacros: { fontSize: 12, color: '#666', marginTop: 2 },
  usdaItemBadge: { fontSize: 11, color: '#4CAF50', fontWeight: '700', marginTop: 4 },
  usdaReset: { fontSize: 12, color: '#F57C00', textAlign: 'center', marginTop: 4, textDecorationLine: 'underline' },
  noteOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  noteSheet: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  noteTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  noteHint: { fontSize: 13, color: '#666', marginBottom: 16 },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  // Favorites
  favSection: { paddingHorizontal: 16, paddingBottom: 4 },
  favTitle: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  favList: { gap: 10, paddingBottom: 4 },
  favCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    width: 120,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  favCardTitle: { fontSize: 12, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  favCardCal: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  // Barcode scanner
  barcodeContainer: { flex: 1, backgroundColor: '#000' },
  barcodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeFrame: {
    width: 260,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  barcodeHint: { color: '#FFF', marginTop: 20, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  barcodeClose: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  barcodeCloseText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
