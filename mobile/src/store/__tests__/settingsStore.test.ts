import * as SecureStore from 'expo-secure-store';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ aiProvider: 'openai' });
    jest.clearAllMocks();
  });

  it('has openai as default provider', () => {
    expect(useSettingsStore.getState().aiProvider).toBe('openai');
  });

  it('setAiProvider updates the store', async () => {
    await useSettingsStore.getState().setAiProvider('gemini');
    expect(useSettingsStore.getState().aiProvider).toBe('gemini');
  });

  it('setAiProvider persists to SecureStore', async () => {
    await useSettingsStore.getState().setAiProvider('claude');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'caloria_ai_provider',
      'claude'
    );
  });

  it('loadFromStorage sets provider from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('gemini');
    await useSettingsStore.getState().loadFromStorage();
    expect(useSettingsStore.getState().aiProvider).toBe('gemini');
  });

  it('loadFromStorage keeps default when nothing stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    await useSettingsStore.getState().loadFromStorage();
    expect(useSettingsStore.getState().aiProvider).toBe('openai');
  });
});
