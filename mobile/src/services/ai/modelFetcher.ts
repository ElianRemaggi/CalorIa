import { AIProvider } from '@/types';

export interface ModelOption {
  id: string;
  displayName: string;
}

export async function fetchGeminiModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini ${response.status}: ${error}`);
  }
  const json = await response.json();
  return (json.models ?? [])
    .filter((m: any) =>
      (m.supportedGenerationMethods ?? []).includes('generateContent')
    )
    .map((m: any) => ({
      id: m.name.replace('models/', ''),
      displayName: m.displayName ?? m.name.replace('models/', ''),
    }));
}

export async function fetchOpenAIModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI ${response.status}: ${error}`);
  }
  const json = await response.json();
  return (json.data ?? [])
    .filter((m: any) =>
      m.id.startsWith('gpt-4o') || m.id.startsWith('gpt-4-turbo') || m.id.startsWith('gpt-4-vision')
    )
    .map((m: any) => ({ id: m.id, displayName: m.id }))
    .sort((a: ModelOption, b: ModelOption) => a.id.localeCompare(b.id));
}

export async function fetchClaudeModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude ${response.status}: ${error}`);
  }
  const json = await response.json();
  return (json.data ?? []).map((m: any) => ({
    id: m.id,
    displayName: m.display_name ?? m.id,
  }));
}

export async function fetchDeepSeekModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch('https://api.deepseek.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek ${response.status}: ${error}`);
  }
  const json = await response.json();
  return (json.data ?? [])
    .map((m: any) => ({ id: m.id, displayName: m.id }))
    .sort((a: ModelOption, b: ModelOption) => a.id.localeCompare(b.id));
}

export async function fetchModels(provider: AIProvider, apiKey: string): Promise<ModelOption[]> {
  switch (provider) {
    case 'gemini': return fetchGeminiModels(apiKey);
    case 'openai': return fetchOpenAIModels(apiKey);
    case 'claude': return fetchClaudeModels(apiKey);
    case 'deepseek': return fetchDeepSeekModels(apiKey);
  }
}
