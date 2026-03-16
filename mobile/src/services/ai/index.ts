import { AIAnalysisResult, AIProvider } from '@/types';
import { getApiKey } from '@/services/secureStorage';
import { analyzeWithOpenAI } from './openaiAdapter';
import { analyzeWithGemini } from './geminiAdapter';
import { analyzeWithClaude } from './claudeAdapter';

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

  switch (provider) {
    case 'openai':
      return analyzeWithOpenAI(imageBase64, apiKey);
    case 'gemini':
      return analyzeWithGemini(imageBase64, apiKey);
    case 'claude':
      return analyzeWithClaude(imageBase64, apiKey);
  }
};
