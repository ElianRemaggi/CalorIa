import { AIAnalysisResult } from '@/types';
import { AI_PROMPT } from './prompt';
import { parseAIJson } from './types';

export const analyzeWithClaude = async (
  imageBase64: string,
  apiKey: string
): Promise<AIAnalysisResult> => {
  const body = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: AI_PROMPT,
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
    promptText: AI_PROMPT,
  };
};
