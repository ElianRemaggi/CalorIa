const BASE_PROMPT = `Analiza la imagen de una comida y devuelve ÚNICAMENTE el siguiente JSON, sin texto adicional, sin markdown, sin bloques de código.

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
- Contá las calorías y macros de TODOS los alimentos visibles en la imagen, incluyendo guarniciones, salsas, bebidas, pan y cualquier otro ítem presente.
- Si hay múltiples porciones o platos en la imagen, sumá el total de todo lo visible.
- Si la imagen no es comida, igual devuelve el JSON con confidence: 0 y un warning explicando.
- Todos los textos en español.`;

export const buildPrompt = (userNote?: string): string => {
  if (!userNote?.trim()) return BASE_PROMPT;
  return `${BASE_PROMPT}

Información adicional del usuario sobre este plato: "${userNote.trim()}"
Tené en cuenta esta información para ajustar el análisis nutricional (por ejemplo, rellenos no visibles, ingredientes específicos, tamaño de porción, etc.).`;
};

export const AI_PROMPT = BASE_PROMPT;

const TEXT_BASE_PROMPT = `Sos un nutricionista experto. El usuario va a describir una comida con palabras y vos tenés que estimar las calorías y macronutrientes.

Devuelve ÚNICAMENTE el siguiente JSON, sin texto adicional, sin markdown, sin bloques de código.

{
  "title": "nombre del plato en español",
  "description": "descripción breve de ingredientes",
  "estimatedCalories": 450,
  "estimatedProteinG": 25,
  "estimatedCarbsG": 40,
  "estimatedFatG": 15,
  "confidence": 0.75,
  "warnings": []
}

Reglas:
- Responde SOLO con el JSON. Ninguna palabra antes ni después.
- Todos los campos son obligatorios.
- estimatedCalories, estimatedProteinG, estimatedCarbsG, estimatedFatG deben ser enteros.
- confidence es un número entre 0 y 1 (más bajo si la descripción es vaga o ambigua).
- warnings es un array de strings para advertencias sobre incertidumbre nutricional.
- Basate en porciones típicas argentinas/latinoamericanas si el usuario no especifica cantidad.
- Sumá el total de todo lo que el usuario mencione (varios platos, bebidas, postres).
- Si la descripción es insuficiente para estimar, devolvé confidence bajo y un warning explicando.
- Todos los textos en español.`;

export const buildTextPrompt = (description: string): string =>
  `${TEXT_BASE_PROMPT}\n\nDescripción del usuario: "${description.trim()}"`;
