import * as SecureStore from 'expo-secure-store';
import {
  saveToken,
  getToken,
  removeToken,
  saveApiKey,
  getApiKey,
  removeApiKey,
  saveAiProvider,
  getAiProvider,
} from '../secureStorage';

describe('secureStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('JWT token', () => {
    it('saveToken calls SecureStore with correct key', async () => {
      await saveToken('abc123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('caloria_jwt', 'abc123');
    });

    it('getToken reads from correct key', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('abc123');
      const token = await getToken();
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('caloria_jwt');
      expect(token).toBe('abc123');
    });

    it('removeToken deletes correct key', async () => {
      await removeToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('caloria_jwt');
    });
  });

  describe('API keys', () => {
    it('saveApiKey uses provider-specific key', async () => {
      await saveApiKey('openai', 'sk-test-key');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'caloria_api_key_openai',
        'sk-test-key'
      );
    });

    it('getApiKey reads provider-specific key', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('sk-gemini-key');
      const key = await getApiKey('gemini');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('caloria_api_key_gemini');
      expect(key).toBe('sk-gemini-key');
    });

    it('removeApiKey deletes provider-specific key', async () => {
      await removeApiKey('claude');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('caloria_api_key_claude');
    });

    it('uses separate keys for each provider', async () => {
      await saveApiKey('openai', 'key-a');
      await saveApiKey('gemini', 'key-b');
      await saveApiKey('claude', 'key-c');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('caloria_api_key_openai', 'key-a');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('caloria_api_key_gemini', 'key-b');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('caloria_api_key_claude', 'key-c');
    });
  });

  describe('AI provider preference', () => {
    it('saveAiProvider stores provider', async () => {
      await saveAiProvider('gemini');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('caloria_ai_provider', 'gemini');
    });

    it('getAiProvider retrieves stored provider', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('claude');
      const provider = await getAiProvider();
      expect(provider).toBe('claude');
    });
  });
});
