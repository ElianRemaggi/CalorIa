export interface RawAIResult {
  title: string;
  description: string;
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
  confidence?: number;
  warnings?: string[];
}

export function parseAIJson(raw: string): RawAIResult {
  // Remove markdown code fences if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned) as RawAIResult;
  } catch {
    // Try to extract JSON object from text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as RawAIResult;
    }
    throw new Error('No se pudo interpretar la respuesta de la IA. Intenta cargar la comida manualmente.');
  }
}
