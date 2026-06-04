import { AIAnalysisResult } from '@/types';
import { buildPrompt, buildTextPrompt } from './prompt';
import { parseAIJson } from './types';

export const analyzeWithGemini = async (
  imageBase64: string,
  apiKey: string,
  model: string = 'gemini-flash-latest',
  mimeType: string = 'image/jpeg',
  userNote?: string
): Promise<AIAnalysisResult> => {
  const prompt = buildPrompt(userNote);
  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error ${response.status}: ${error}`);
  }

  const json = await response.json();
  // Thinking models return multiple parts; filter out thought parts and join the rest
  const parts: any[] = json.candidates?.[0]?.content?.parts ?? [];
  const rawContent: string = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('');

  if (!rawContent) {
    const finishReason = json.candidates?.[0]?.finishReason ?? 'unknown';
    throw new Error(`Gemini devolvió respuesta vacía (finishReason: ${finishReason})`);
  }

  const parsed = parseAIJson(rawContent);

  return {
    ...parsed,
    provider: 'gemini',
    rawResponse: rawContent,
    promptText: prompt,
  };
};

export const analyzeTextWithGemini = async (
  description: string,
  apiKey: string,
  model: string = 'gemini-flash-latest'
): Promise<AIAnalysisResult> => {
  const prompt = buildTextPrompt(description);
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error ${response.status}: ${error}`);
  }

  const json = await response.json();
  const parts: any[] = json.candidates?.[0]?.content?.parts ?? [];
  const rawContent: string = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');

  if (!rawContent) {
    const finishReason = json.candidates?.[0]?.finishReason ?? 'unknown';
    throw new Error(`Gemini devolvió respuesta vacía (finishReason: ${finishReason})`);
  }

  const parsed = parseAIJson(rawContent);
  return { ...parsed, provider: 'gemini', rawResponse: rawContent, promptText: prompt };
};
