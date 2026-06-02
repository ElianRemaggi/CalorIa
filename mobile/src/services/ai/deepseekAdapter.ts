import { AIAnalysisResult } from '@/types';

// DeepSeek's API does not support image/vision input (image_url content type is rejected).
// Default model updated to deepseek-v4-flash (deepseek-chat no longer exists).
export const analyzeWithDeepSeek = async (
  _imageBase64: string,
  _apiKey: string,
  _model: string = 'deepseek-v4-flash',
  _mimeType: string = 'image/jpeg'
): Promise<AIAnalysisResult> => {
  throw new Error(
    'DeepSeek no soporta análisis de imágenes. Elegí otro proveedor (OpenAI, Gemini o Claude) en Ajustes > Proveedor IA.'
  );
};
