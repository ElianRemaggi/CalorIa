import { AIAnalysisResult } from '@/types';
import { AI_PROMPT } from './prompt';
import { parseAIJson } from './types';

export const analyzeWithOpenAI = async (
  imageBase64: string,
  apiKey: string
): Promise<AIAnalysisResult> => {
  const body = {
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
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
    promptText: AI_PROMPT,
  };
};
