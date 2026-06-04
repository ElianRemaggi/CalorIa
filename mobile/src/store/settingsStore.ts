import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AIProvider } from '@/types';
import {
  getAiProvider, saveAiProvider,
  getSelectedModel, saveSelectedModel,
} from '@/services/secureStorage';

export type MealReminderKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const DEFAULT_REMINDER_TIMES: Record<MealReminderKey, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00',
  snack: '16:00',
};

const REMINDER_TIMES_KEY = 'caloria_reminder_times';

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  gemini: 'gemini-flash-latest',
  claude: 'claude-3-haiku-20240307',
  deepseek: 'deepseek-chat',
};

interface SettingsStore {
  aiProvider: AIProvider;
  selectedModels: Record<AIProvider, string>;
  reminderTimes: Record<MealReminderKey, string>;
  setAiProvider: (provider: AIProvider) => Promise<void>;
  setSelectedModel: (provider: AIProvider, model: string) => Promise<void>;
  setReminderTime: (type: MealReminderKey, time: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  aiProvider: 'openai',
  selectedModels: { ...DEFAULT_MODELS },
  reminderTimes: { ...DEFAULT_REMINDER_TIMES },

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

  setReminderTime: async (type, time) => {
    const next = { ...get().reminderTimes, [type]: time };
    set({ reminderTimes: next });
    await SecureStore.setItemAsync(REMINDER_TIMES_KEY, JSON.stringify(next));
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

    const timesRaw = await SecureStore.getItemAsync(REMINDER_TIMES_KEY);
    if (timesRaw) {
      set({ reminderTimes: { ...DEFAULT_REMINDER_TIMES, ...JSON.parse(timesRaw) } });
    }
  },
}));
