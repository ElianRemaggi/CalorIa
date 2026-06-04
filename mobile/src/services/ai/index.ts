import { AIAnalysisResult, AIProvider } from '@/types';
import { getApiKey } from '@/services/secureStorage';
import { useSettingsStore } from '@/store/settingsStore';
import { analyzeWithOpenAI, analyzeTextWithOpenAI } from './openaiAdapter';
import { analyzeWithGemini, analyzeTextWithGemini } from './geminiAdapter';
import { analyzeWithClaude, analyzeTextWithClaude } from './claudeAdapter';
import { analyzeWithDeepSeek, analyzeTextWithDeepSeek } from './deepseekAdapter';

export const analyzeImage = async (
  imageBase64: string,
  provider: AIProvider,
  mimeType: string = 'image/jpeg',
  userNote?: string
): Promise<AIAnalysisResult> => {
  const apiKey = await getApiKey(provider);
  if (!apiKey) {
    throw new Error(
      `No hay API key configurada para ${provider}. Configurala en Ajustes > Proveedor IA.`
    );
  }

  const { selectedModels } = useSettingsStore.getState();
  const model = selectedModels[provider];

  switch (provider) {
    case 'openai':
      return analyzeWithOpenAI(imageBase64, apiKey, model, mimeType, userNote);
    case 'gemini':
      return analyzeWithGemini(imageBase64, apiKey, model, mimeType, userNote);
    case 'claude':
      return analyzeWithClaude(imageBase64, apiKey, model, mimeType, userNote);
    case 'deepseek':
      return analyzeWithDeepSeek(imageBase64, apiKey, model, mimeType);
  }
};

export const analyzeText = async (
  description: string,
  provider: AIProvider
): Promise<AIAnalysisResult> => {
  const apiKey = await getApiKey(provider);
  if (!apiKey) {
    throw new Error(
      `No hay API key configurada para ${provider}. Configurala en Ajustes > Proveedor IA.`
    );
  }

  const { selectedModels } = useSettingsStore.getState();
  const model = selectedModels[provider];

  switch (provider) {
    case 'openai':
      return analyzeTextWithOpenAI(description, apiKey, model);
    case 'gemini':
      return analyzeTextWithGemini(description, apiKey, model);
    case 'claude':
      return analyzeTextWithClaude(description, apiKey, model);
    case 'deepseek':
      return analyzeTextWithDeepSeek(description, apiKey, model);
  }
};
