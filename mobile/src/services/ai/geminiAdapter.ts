import { AIAnalysisResult } from '@/types';
import { AI_PROMPT } from './prompt';
import { parseAIJson } from './types';

export const analyzeWithGemini = async (
  imageBase64: string,
  apiKey: string
): Promise<AIAnalysisResult> => {
  const body = {
    contents: [
      {
        parts: [
          { text: AI_PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.2,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
  const rawContent: string =
    json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed = parseAIJson(rawContent);

  return {
    ...parsed,
    provider: 'gemini',
    rawResponse: rawContent,
    promptText: AI_PROMPT,
  };
};
