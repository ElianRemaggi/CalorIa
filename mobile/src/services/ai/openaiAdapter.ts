import { AIAnalysisResult } from '@/types';
import { buildPrompt, buildTextPrompt } from './prompt';
import { parseAIJson } from './types';

export const analyzeWithOpenAI = async (
  imageBase64: string,
  apiKey: string,
  model: string = 'gpt-4o',
  mimeType: string = 'image/jpeg',
  userNote?: string
): Promise<AIAnalysisResult> => {
  const prompt = buildPrompt(userNote);
  const body = {
    model,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Eres un analizador de comida. Responde siempre con un JSON válido siguiendo exactamente el formato indicado.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
        ],
      },
    ],
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${error}`);
  }

  const json = await response.json();
  const rawContent: string = json.choices?.[0]?.message?.content ?? '';
  const parsed = parseAIJson(rawContent);

  return {
    ...parsed,
    provider: 'openai',
    rawResponse: rawContent,
    promptText: prompt,
  };
};

export const analyzeTextWithOpenAI = async (
  description: string,
  apiKey: string,
  model: string = 'gpt-4o'
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${error}`);
  }

  const json = await response.json();
  const rawContent: string = json.choices?.[0]?.message?.content ?? '';
  const parsed = parseAIJson(rawContent);

  return { ...parsed, provider: 'openai', rawResponse: rawContent, promptText: prompt };
};
