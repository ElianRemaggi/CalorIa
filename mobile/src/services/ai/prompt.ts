export const AI_PROMPT = `Analiza la imagen de una comida y devuelve ÚNICAMENTE el siguiente JSON, sin texto adicional, sin markdown, sin bloques de código.

{
  "title": "nombre del plato en español",
  "description": "descripción breve de ingredientes observados",
  "estimatedCalories": 450,
  "estimatedProteinG": 25,
  "estimatedCarbsG": 40,
  "estimatedFatG": 15,
  "confidence": 0.85,
  "warnings": []
}

Reglas:
- Responde SOLO con el JSON. Ninguna palabra antes ni después.
- Todos los campos son obligatorios.
- estimatedCalories, estimatedProteinG, estimatedCarbsG, estimatedFatG deben ser enteros.
- confidence es un número entre 0 y 1.
- warnings es un array de strings (vacío si no hay advertencias).
- Si la imagen no es comida, igual devuelve el JSON con confidence: 0 y un warning explicando.
- Todos los textos en español.`;
