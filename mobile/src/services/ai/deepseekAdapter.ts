import { AIAnalysisResult } from '@/types';
import { buildTextPrompt } from './prompt';
import { parseAIJson } from './types';

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

export const analyzeTextWithDeepSeek = async (
  description: string,
  apiKey: string,
  model: string = 'deepseek-v4-flash'
): Promise<AIAnalysisResult> => {
  const prompt = buildTextPrompt(description);
  const body = {
    model,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Eres un nutricionista experto. Responde siempre con un JSON válido siguiendo exactamente el formato indicado.',
      },
      { role: 'user', content: prompt },
    ],
  };

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek error ${response.status}: ${error}`);
  }

  const json = await response.json();
  const rawContent: string = json.choices?.[0]?.message?.content ?? '';
  const parsed = parseAIJson(rawContent);
  return { ...parsed, provider: 'deepseek', rawResponse: rawContent, promptText: prompt };
};
