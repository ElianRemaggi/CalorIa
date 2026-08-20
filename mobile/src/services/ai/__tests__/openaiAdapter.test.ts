import { analyzeWithOpenAI, analyzeTextWithOpenAI } from '../openaiAdapter';

const validResult = {
  title: 'Milanesa con puré',
  description: 'Milanesa de carne con puré de papas',
  estimatedCalories: 620,
  estimatedProteinG: 35,
  estimatedCarbsG: 55,
  estimatedFatG: 28,
  confidence: 0.8,
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

describe('openaiAdapter', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('analyzeWithOpenAI', () => {
    it('extracts choices[0].message.content and parses it into the result contract', async () => {
      mockFetchOnce({ choices: [{ message: { content: JSON.stringify(validResult) } }] });

      const result = await analyzeWithOpenAI('base64img', 'sk-key');

      expect(result).toMatchObject(validResult);
      expect(result.provider).toBe('openai');
      expect(result.rawResponse).toBe(JSON.stringify(validResult));
    });

    it('unwraps a markdown-fenced JSON body', async () => {
      const fenced = '```json\n' + JSON.stringify(validResult) + '\n```';
      mockFetchOnce({ choices: [{ message: { content: fenced } }] });

      const result = await analyzeWithOpenAI('base64img', 'sk-key');

      expect(result.title).toBe(validResult.title);
    });

    it('sends the image as a data URL with the given mimeType and the API key as a bearer token', async () => {
      mockFetchOnce({ choices: [{ message: { content: JSON.stringify(validResult) } }] });

      await analyzeWithOpenAI('base64img', 'sk-key', 'gpt-4o', 'image/png');

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(init.headers.Authorization).toBe('Bearer sk-key');
      const body = JSON.parse(init.body);
      expect(body.model).toBe('gpt-4o');
      const imagePart = body.messages[1].content.find((p: any) => p.type === 'image_url');
      expect(imagePart.image_url.url).toBe('data:image/png;base64,base64img');
    });

    it('throws with the HTTP status and body when the request fails', async () => {
      mockFetchOnce('invalid api key', { ok: false, status: 401 });

      await expect(analyzeWithOpenAI('base64img', 'bad-key')).rejects.toThrow(
        'OpenAI error 401: invalid api key'
      );
    });

    it('throws a parse error when the response has no content to extract', async () => {
      mockFetchOnce({ choices: [] });

      await expect(analyzeWithOpenAI('base64img', 'sk-key')).rejects.toThrow(
        'No se pudo interpretar la respuesta de la IA'
      );
    });
  });

  describe('analyzeTextWithOpenAI', () => {
    it('extracts choices[0].message.content for a text-only request', async () => {
      mockFetchOnce({ choices: [{ message: { content: JSON.stringify(validResult) } }] });

      const result = await analyzeTextWithOpenAI('milanesa con pure', 'sk-key');

      expect(result).toMatchObject(validResult);
      expect(result.provider).toBe('openai');
    });
  });
});
