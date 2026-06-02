import { AIAnalysisResult } from '@/types';
import { AI_PROMPT } from './prompt';
import { parseAIJson } from './types';

export const analyzeWithDeepSeek = async (
  imageBase64: string,
  apiKey: string,
  model: string = 'deepseek-chat'
): Promise<AIAnalysisResult> => {
  const body = {
    model,
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'Eres un analizador de comida. Responde siempre con un JSON válido siguiendo exactamente el formato indicado. No agregues texto antes ni después del JSON.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: AI_PROMPT,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
  };

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek error ${response.status}: ${error}`);
  }

  const json = await response.json();
  const rawContent: string = json.choices?.[0]?.message?.content ?? '';
  const parsed = parseAIJson(rawContent);

  return {
    ...parsed,
    provider: 'deepseek',
    rawResponse: rawContent,
    promptText: AI_PROMPT,
  };
};
