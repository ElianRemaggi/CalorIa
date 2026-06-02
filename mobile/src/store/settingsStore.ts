import { create } from 'zustand';
import { AIProvider } from '@/types';
import {
  getAiProvider, saveAiProvider,
  getSelectedModel, saveSelectedModel,
} from '@/services/secureStorage';

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-flash',
  claude: 'claude-3-haiku-20240307',
  deepseek: 'deepseek-chat',
};

interface SettingsStore {
  aiProvider: AIProvider;
  selectedModels: Record<AIProvider, string>;
  setAiProvider: (provider: AIProvider) => Promise<void>;
  setSelectedModel: (provider: AIProvider, model: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  aiProvider: 'openai',
  selectedModels: { ...DEFAULT_MODELS },

  setAiProvider: async (provider) => {
    await saveAiProvider(provider);
    set({ aiProvider: provider });
  },

  setSelectedModel: async (provider, model) => {
    await saveSelectedModel(provider, model);
    set((state) => ({
      selectedModels: { ...state.selectedModels, [provider]: model },
    }));
  },

  loadFromStorage: async () => {
    const stored = await getAiProvider();
    if (stored) set({ aiProvider: stored });

    const models: Record<AIProvider, string> = { ...DEFAULT_MODELS };
    for (const provider of ['openai', 'gemini', 'claude', 'deepseek'] as AIProvider[]) {
      const model = await getSelectedModel(provider);
      if (model) models[provider] = model;
    }
    set({ selectedModels: models });
  },
}));
