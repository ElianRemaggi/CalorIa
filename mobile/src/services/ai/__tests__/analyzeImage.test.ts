import { analyzeImage } from '../index';

// Mock secure storage
jest.mock('@/services/secureStorage', () => ({
  getApiKey: jest.fn(),
}));

// Mock AI adapters
jest.mock('../openaiAdapter', () => ({
  analyzeWithOpenAI: jest.fn(),
}));
jest.mock('../geminiAdapter', () => ({
  analyzeWithGemini: jest.fn(),
}));
jest.mock('../claudeAdapter', () => ({
  analyzeWithClaude: jest.fn(),
}));

import { getApiKey } from '@/services/secureStorage';
import { analyzeWithOpenAI } from '../openaiAdapter';
import { analyzeWithGemini } from '../geminiAdapter';
import { analyzeWithClaude } from '../claudeAdapter';

const mockResult = {
  title: 'Ensalada César',
  description: 'Ensalada con pollo',
  estimatedCalories: 320,
  estimatedProteinG: 28,
  estimatedCarbsG: 12,
  estimatedFatG: 18,
  provider: 'openai' as const,
  rawResponse: '{}',
  promptText: 'analyze this',
};

describe('analyzeImage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when no API key is configured', async () => {
    (getApiKey as jest.Mock).mockResolvedValueOnce(null);
    await expect(analyzeImage('base64img', 'openai')).rejects.toThrow(
      'No hay API key configurada para openai'
    );
  });

  it('dispatches to OpenAI adapter when provider is openai', async () => {
    (getApiKey as jest.Mock).mockResolvedValueOnce('sk-openai-key');
    (analyzeWithOpenAI as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await analyzeImage('base64img', 'openai');

    expect(analyzeWithOpenAI).toHaveBeenCalledWith('base64img', 'sk-openai-key');
    expect(analyzeWithGemini).not.toHaveBeenCalled();
    expect(analyzeWithClaude).not.toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  it('dispatches to Gemini adapter when provider is gemini', async () => {
    (getApiKey as jest.Mock).mockResolvedValueOnce('gemini-key');
    (analyzeWithGemini as jest.Mock).mockResolvedValueOnce({ ...mockResult, provider: 'gemini' });

    await analyzeImage('base64img', 'gemini');

    expect(analyzeWithGemini).toHaveBeenCalledWith('base64img', 'gemini-key');
    expect(analyzeWithOpenAI).not.toHaveBeenCalled();
  });

  it('dispatches to Claude adapter when provider is claude', async () => {
    (getApiKey as jest.Mock).mockResolvedValueOnce('claude-key');
    (analyzeWithClaude as jest.Mock).mockResolvedValueOnce({ ...mockResult, provider: 'claude' });

    await analyzeImage('base64img', 'claude');

    expect(analyzeWithClaude).toHaveBeenCalledWith('base64img', 'claude-key');
    expect(analyzeWithOpenAI).not.toHaveBeenCalled();
  });

  it('propagates adapter errors', async () => {
    (getApiKey as jest.Mock).mockResolvedValueOnce('sk-key');
    (analyzeWithOpenAI as jest.Mock).mockRejectedValueOnce(new Error('Rate limit exceeded'));

    await expect(analyzeImage('base64img', 'openai')).rejects.toThrow('Rate limit exceeded');
  });
});
