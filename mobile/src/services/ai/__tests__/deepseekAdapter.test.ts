import { analyzeWithDeepSeek, analyzeTextWithDeepSeek } from '../deepseekAdapter';

const validResult = {
  title: 'Arroz con pollo',
  description: 'Arroz con pollo y vegetales salteados',
  estimatedCalories: 540,
  estimatedProteinG: 32,
  estimatedCarbsG: 60,
  estimatedFatG: 14,
  confidence: 0.65,
  warnings: [],
};

function mockFetchOnce(body: unknown, opts: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = opts;
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

describe('deepseekAdapter', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('analyzeWithDeepSeek', () => {
    it('always rejects since DeepSeek does not support image input, without calling the network', async () => {
      await expect(analyzeWithDeepSeek('base64img', 'ds-key')).rejects.toThrow(
        'DeepSeek no soporta análisis de imágenes'
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('analyzeTextWithDeepSeek', () => {
    it('extracts choices[0].message.content and parses it into the result contract', async () => {
      mockFetchOnce({ choices: [{ message: { content: JSON.stringify(validResult) } }] });

      const result = await analyzeTextWithDeepSeek('arroz con pollo', 'ds-key');

      expect(result).toMatchObject(validResult);
      expect(result.provider).toBe('deepseek');
    });

    it('calls the DeepSeek chat completions endpoint with the given model and bearer key', async () => {
      mockFetchOnce({ choices: [{ message: { content: JSON.stringify(validResult) } }] });

      await analyzeTextWithDeepSeek('arroz con pollo', 'ds-key', 'deepseek-v4-flash');

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('https://api.deepseek.com/chat/completions');
      expect(init.headers.Authorization).toBe('Bearer ds-key');
      expect(JSON.parse(init.body).model).toBe('deepseek-v4-flash');
    });

    it('throws with the HTTP status and body when the request fails', async () => {
      mockFetchOnce('model deepseek-chat does not exist', { ok: false, status: 400 });

      await expect(analyzeTextWithDeepSeek('arroz con pollo', 'ds-key')).rejects.toThrow(
        'DeepSeek error 400: model deepseek-chat does not exist'
      );
    });
  });
});
