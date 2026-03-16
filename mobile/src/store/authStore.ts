import { create } from 'zustand';
import { UserSession } from '@/types';
import { getToken, removeToken, saveToken } from '@/services/secureStorage';
import client from '@/api/client';

interface AuthStore {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserSession, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user, token) => {
    await saveToken(token);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    await removeToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadFromStorage: async () => {
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // Fetch current user with stored token
      const { data } = await client.get('/users/me');
      // We need onboardingCompleted from profile check
      let onboardingCompleted = false;
      try {
        const profileRes = await client.get('/profile/me');
        onboardingCompleted = profileRes.data.onboardingCompleted ?? false;
      } catch {
        // Profile may not exist yet
      }
      set({
        user: { ...data, onboardingCompleted },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
