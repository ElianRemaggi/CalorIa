import { AIAnalysisResult, AIProvider } from '@/types';
import { getApiKey } from '@/services/secureStorage';
import { useSettingsStore } from '@/store/settingsStore';
import { analyzeWithOpenAI } from './openaiAdapter';
import { analyzeWithGemini } from './geminiAdapter';
import { analyzeWithClaude } from './claudeAdapter';
import { analyzeWithDeepSeek } from './deepseekAdapter';

export const analyzeImage = async (
  imageBase64: string,
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
      return analyzeWithOpenAI(imageBase64, apiKey, model);
    case 'gemini':
      return analyzeWithGemini(imageBase64, apiKey, model);
    case 'claude':
      return analyzeWithClaude(imageBase64, apiKey, model);
    case 'deepseek':
      return analyzeWithDeepSeek(imageBase64, apiKey, model);
  }
};
