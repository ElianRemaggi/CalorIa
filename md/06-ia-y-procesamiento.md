# Integración de IA y Procesamiento de Comidas

## 1. Objetivo
Soportar múltiples proveedores de IA en el frontend usando API key local del usuario, devolviendo un formato estructurado y consistente para el backend.

## 2. Proveedores iniciales
- OpenAI
- Gemini
- Claude

## 3. Restricciones del MVP
- la API key vive solo en el dispositivo
- no se envía al backend
- no se almacenan fotos de forma persistente
- la imagen se usa solo para análisis puntual
- el backend recibe únicamente datos estructurados resultantes

## 4. Flujo general
1. usuario selecciona proveedor
2. usuario guarda API key en SecureStore
3. usuario toma o elige foto
4. app llama al proveedor IA
5. proveedor devuelve resultado JSON
6. app muestra preview editable
7. app envía al backend el resultado final confirmado

## 5. Contrato lógico esperado de IA
La respuesta debe incluir:
- título del plato
- descripción breve de ingredientes detectados
- calorías estimadas
- proteínas estimadas
- carbohidratos estimados
- grasas estimadas
- nivel de confianza opcional
- warnings opcionales

## 6. JSON objetivo
```json
{
  "title": "Arroz con pollo y verduras",
  "description": "Se observan arroz blanco, pollo salteado y verduras mixtas.",
  "estimatedCalories": 620,
  "estimatedProteinG": 38,
  "estimatedCarbsG": 70,
  "estimatedFatG": 18,
  "confidence": 0.72,
  "warnings": ["La porción fue estimada visualmente."]
}
```

## 7. Prompt base recomendado
Usar un prompt que:
- fuerce salida JSON estricta
- advierta que no invente precisión clínica
- estime porción visual
- responda en español
- mantenga campos constantes

### Ejemplo de prompt
```text
Analiza la imagen de una comida y responde únicamente en formato JSON válido.
Debes estimar el plato observado de forma aproximada, no clínica.

Campos requeridos:
- title: string
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
```

## 8. Normalización del resultado en frontend
Crear adaptadores por proveedor:
- `openaiAdapter`
- `geminiAdapter`
- `claudeAdapter`

Todos deben devolver el mismo tipo interno:
```ts
type AIAnalysisResult = {
  title: string;
  description: string;
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
  confidence?: number;
  warnings?: string[];
  provider: "openai" | "gemini" | "claude";
  rawResponse: string;
  promptText: string;
};
```

## 9. Reglas UX críticas
- siempre permitir edición manual antes de guardar
- si el parse falla, mostrar opción de carga manual
- si el proveedor devuelve texto no JSON, intentar recuperación mínima
- si falla de nuevo, no bloquear al usuario

## 10. Qué enviar al backend
Enviar:
- valores estimados
- valores finales
- provider
- promptText
- rawResponse
- parsedResponse

No enviar:
- API key
- imagen persistente

## 11. Riesgos
- respuestas no estructuradas
- diferencias por proveedor
- latencia alta
- mala estimación de porciones
- costo variable del proveedor del usuario

## 12. Criterios de aceptación
- al menos un proveedor funciona con salida JSON estable
- preview editable visible antes de guardar
- parse robusto con fallback
- backend recibe estructura uniforme independientemente del proveedor
