import { create } from 'zustand';
import { AIProvider } from '@/types';
import { getAiProvider, saveAiProvider } from '@/services/secureStorage';

interface SettingsStore {
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  aiProvider: 'openai',

  setAiProvider: async (provider) => {
    await saveAiProvider(provider);
    set({ aiProvider: provider });
  },

  loadFromStorage: async () => {
    const stored = await getAiProvider();
    if (stored) set({ aiProvider: stored });
  },
}));
