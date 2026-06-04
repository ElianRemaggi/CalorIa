import { AIAnalysisResult } from '@/types';
import { buildPrompt, buildTextPrompt } from './prompt';
import { parseAIJson } from './types';

export const analyzeWithClaude = async (
  imageBase64: string,
  apiKey: string,
  model: string = 'claude-3-haiku-20240307',
  mimeType: string = 'image/jpeg',
  userNote?: string
): Promise<AIAnalysisResult> => {
  const prompt = buildPrompt(userNote);
  const body = {
    model,
    max_tokens: 1024,
    system: 'Eres un analizador de comida. Responde siempre con un JSON válido siguiendo exactamente el formato indicado. No agregues texto antes ni después del JSON.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude error ${response.status}: ${error}`);
  }

  const json = await response.json();
  const rawContent: string = json.content?.[0]?.text ?? '';
  const parsed = parseAIJson(rawContent);

  return {
    ...parsed,
    provider: 'claude',
    rawResponse: rawContent,
    promptText: prompt,
  };
};

export const analyzeTextWithClaude = async (
  description: string,
  apiKey: string,
  model: string = 'claude-3-haiku-20240307'
): Promise<AIAnalysisResult> => {
  const prompt = buildTextPrompt(description);
  const body = {
    model,
    max_tokens: 1024,
    system: 'Eres un nutricionista experto. Responde siempre con un JSON válido siguiendo exactamente el formato indicado. No agregues texto antes ni después del JSON.',
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude error ${response.status}: ${error}`);
  }

  const json = await response.json();
  const rawContent: string = json.content?.[0]?.text ?? '';
  const parsed = parseAIJson(rawContent);
  return { ...parsed, provider: 'claude', rawResponse: rawContent, promptText: prompt };
};
