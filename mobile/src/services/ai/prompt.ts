export const AI_PROMPT = `Analiza la imagen de una comida y responde únicamente en formato JSON válido.
Debes estimar el plato observado de forma aproximada, no clínica.

Campos requeridos:
- title: string (nombre del plato en español)
- description: string breve en español describiendo ingredientes observados
- estimatedCalories: integer
- estimatedProteinG: integer
- estimatedCarbsG: integer
- estimatedFatG: integer
- confidence: number entre 0 y 1
- warnings: array de strings

Reglas:
- no agregues texto fuera del JSON
- si no estás seguro, usa warnings
- si la comida es ambigua, da la mejor estimación razonable
- responde en español
- devuelve SOLO el JSON, sin markdown, sin bloques de código`;
