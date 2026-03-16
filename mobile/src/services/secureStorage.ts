import * as SecureStore from 'expo-secure-store';
import { AIProvider } from '@/types';

const KEYS = {
  JWT: 'caloria_jwt',
  AI_PROVIDER: 'caloria_ai_provider',
  apiKey: (provider: AIProvider) => `caloria_api_key_${provider}`,
};

export const saveToken = (token: string) => SecureStore.setItemAsync(KEYS.JWT, token);
export const getToken = () => SecureStore.getItemAsync(KEYS.JWT);
export const removeToken = () => SecureStore.deleteItemAsync(KEYS.JWT);

export const saveApiKey = (provider: AIProvider, key: string) =>
  SecureStore.setItemAsync(KEYS.apiKey(provider), key);
export const getApiKey = (provider: AIProvider) =>
  SecureStore.getItemAsync(KEYS.apiKey(provider));
export const removeApiKey = (provider: AIProvider) =>
  SecureStore.deleteItemAsync(KEYS.apiKey(provider));

export const saveAiProvider = (provider: AIProvider) =>
  SecureStore.setItemAsync(KEYS.AI_PROVIDER, provider);
export const getAiProvider = () =>
  SecureStore.getItemAsync(KEYS.AI_PROVIDER) as Promise<AIProvider | null>;
