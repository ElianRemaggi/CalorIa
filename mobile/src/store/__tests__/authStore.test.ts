import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../authStore';

// Mock the API client
jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import client from '@/api/client';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  onboardingCompleted: true,
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts unauthenticated', () => {
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('sets user and isAuthenticated', async () => {
      await useAuthStore.getState().setUser(mockUser, 'my-token');
      const { user, isAuthenticated, isLoading } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
      expect(isLoading).toBe(false);
    });

    it('saves token to SecureStore', async () => {
      await useAuthStore.getState().setUser(mockUser, 'my-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('caloria_jwt', 'my-token');
    });
  });

  describe('clearAuth', () => {
    it('clears user and marks unauthenticated', async () => {
      await useAuthStore.getState().setUser(mockUser, 'token');
      await useAuthStore.getState().clearAuth();
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('removes token from SecureStore', async () => {
      await useAuthStore.getState().clearAuth();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('caloria_jwt');
    });
  });

  describe('loadFromStorage', () => {
    it('sets isLoading false when no token found', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      await useAuthStore.getState().loadFromStorage();
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('restores session when token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('stored-token');
      (client.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockUser })           // /users/me
        .mockResolvedValueOnce({ data: { onboardingCompleted: true } }); // /profile/me

      await useAuthStore.getState().loadFromStorage();
      const { isAuthenticated, isLoading, user } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(isLoading).toBe(false);
      expect(user?.email).toBe('test@example.com');
    });

    it('clears token and sets unauthenticated when API call fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('bad-token');
      (client.get as jest.Mock).mockRejectedValueOnce(new Error('401'));

      await useAuthStore.getState().loadFromStorage();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('caloria_jwt');
    });
  });
});
