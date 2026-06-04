import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import { FavoriteMeal } from '@/types';

const FILE_PATH = `${FileSystem.documentDirectory}caloria_favorites.json`;

const persist = async (favorites: FavoriteMeal[]) => {
  await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(favorites));
};

interface FavoritesStore {
  favorites: FavoriteMeal[];
  loadFromStorage: () => Promise<void>;
  addFavorite: (meal: FavoriteMeal) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],

  loadFromStorage: async () => {
    try {
      const info = await FileSystem.getInfoAsync(FILE_PATH);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(FILE_PATH);
        set({ favorites: JSON.parse(raw) });
      }
    } catch {}
  },

  addFavorite: async (meal) => {
    const next = [meal, ...get().favorites.filter((f) => f.id !== meal.id)];
    set({ favorites: next });
    await persist(next);
  },

  removeFavorite: async (id) => {
    const next = get().favorites.filter((f) => f.id !== id);
    set({ favorites: next });
    await persist(next);
  },

  isFavorite: (id) => get().favorites.some((f) => f.id === id),
}));
