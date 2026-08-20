import { analyzeWithClaude, analyzeTextWithClaude } from '../claudeAdapter';

const validResult = {
  title: 'Tarta de verduras',
  description: 'Tarta de acelga y queso',
  estimatedCalories: 410,
  estimatedProteinG: 15,
  estimatedCarbsG: 30,
  estimatedFatG: 24,
  confidence: 0.7,
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

describe('claudeAdapter', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('analyzeWithClaude', () => {
    it('extracts content[0].text and parses it into the result contract', async () => {
      mockFetchOnce({ content: [{ type: 'text', text: JSON.stringify(validResult) }] });

      const result = await analyzeWithClaude('base64img', 'claude-key');

      expect(result).toMatchObject(validResult);
      expect(result.provider).toBe('claude');
    });

    it('unwraps a markdown-fenced JSON body', async () => {
      const fenced = '```json\n' + JSON.stringify(validResult) + '\n```';
      mockFetchOnce({ content: [{ type: 'text', text: fenced }] });

      const result = await analyzeWithClaude('base64img', 'claude-key');

      expect(result.title).toBe(validResult.title);
    });

    it('sends the API key via x-api-key and the raw base64 image as a base64 source block', async () => {
      mockFetchOnce({ content: [{ type: 'text', text: JSON.stringify(validResult) }] });

      await analyzeWithClaude('base64img', 'claude-key', 'claude-3-haiku-20240307', 'image/webp');

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(init.headers['x-api-key']).toBe('claude-key');
      const body = JSON.parse(init.body);
      const imagePart = body.messages[0].content.find((p: any) => p.type === 'image');
      expect(imagePart.source).toEqual({
        type: 'base64',
        media_type: 'image/webp',
        data: 'base64img',
      });
    });

    it('throws with the HTTP status and body when the request fails', async () => {
      mockFetchOnce('overloaded', { ok: false, status: 529 });

      await expect(analyzeWithClaude('base64img', 'claude-key')).rejects.toThrow(
        'Claude error 529: overloaded'
      );
    });

    it('throws a parse error when the response has no content to extract', async () => {
      mockFetchOnce({ content: [] });

      await expect(analyzeWithClaude('base64img', 'claude-key')).rejects.toThrow(
        'No se pudo interpretar la respuesta de la IA'
      );
    });
  });

  describe('analyzeTextWithClaude', () => {
    it('extracts content[0].text for a text-only request', async () => {
      mockFetchOnce({ content: [{ type: 'text', text: JSON.stringify(validResult) }] });

      const result = await analyzeTextWithClaude('tarta de acelga', 'claude-key');

      expect(result).toMatchObject(validResult);
      expect(result.provider).toBe('claude');
    });
  });
});
