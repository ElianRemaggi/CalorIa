import { analyzeWithGemini, analyzeTextWithGemini } from '../geminiAdapter';

const validResult = {
  title: 'Ensalada César',
  description: 'Ensalada con pollo, lechuga y aderezo césar',
  estimatedCalories: 320,
  estimatedProteinG: 28,
  estimatedCarbsG: 12,
  estimatedFatG: 18,
  confidence: 0.85,
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

describe('geminiAdapter', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('analyzeWithGemini', () => {
    it('extracts candidates[0].content.parts and parses it into the result contract', async () => {
      mockFetchOnce({
        candidates: [{ content: { parts: [{ text: JSON.stringify(validResult) }] } }],
      });

      const result = await analyzeWithGemini('base64img', 'gemini-key');

      expect(result).toMatchObject(validResult);
      expect(result.provider).toBe('gemini');
    });

    it('filters out thought parts from thinking models and joins the remaining text', async () => {
      mockFetchOnce({
        candidates: [
          {
            content: {
              parts: [
                { thought: true, text: 'Razonando sobre la imagen...' },
                { text: JSON.stringify(validResult) },
              ],
            },
          },
        ],
      });

      const result = await analyzeWithGemini('base64img', 'gemini-key');

      expect(result.title).toBe(validResult.title);
    });

    it('throws with the finishReason when there is no usable content', async () => {
      mockFetchOnce({
        candidates: [{ content: { parts: [] }, finishReason: 'SAFETY' }],
      });

      await expect(analyzeWithGemini('base64img', 'gemini-key')).rejects.toThrow(
        'Gemini devolvió respuesta vacía (finishReason: SAFETY)'
      );
    });

    it('sends the raw base64 image data (not a data URL) with its mimeType, and the key as a query param', async () => {
      mockFetchOnce({
        candidates: [{ content: { parts: [{ text: JSON.stringify(validResult) }] } }],
      });

      await analyzeWithGemini('base64img', 'gemini-key', 'gemini-flash-latest', 'image/png');

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=gemini-key'
      );
      const body = JSON.parse(init.body);
      const inlineData = body.contents[0].parts.find((p: any) => p.inline_data)?.inline_data;
      expect(inlineData).toEqual({ mime_type: 'image/png', data: 'base64img' });
    });

    it('throws with the HTTP status and body when the request fails', async () => {
      mockFetchOnce('quota exceeded', { ok: false, status: 429 });

      await expect(analyzeWithGemini('base64img', 'gemini-key')).rejects.toThrow(
        'Gemini error 429: quota exceeded'
      );
    });
  });

  describe('analyzeTextWithGemini', () => {
    it('extracts candidates[0].content.parts for a text-only request', async () => {
      mockFetchOnce({
        candidates: [{ content: { parts: [{ text: JSON.stringify(validResult) }] } }],
      });

      const result = await analyzeTextWithGemini('cesar salad con pollo', 'gemini-key');

      expect(result).toMatchObject(validResult);
      expect(result.provider).toBe('gemini');
    });
  });
});
