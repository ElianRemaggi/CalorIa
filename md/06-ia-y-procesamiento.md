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
6. app muestra preview editable **y simultáneamente busca el título en USDA (ver sección 13)**
7. usuario puede elegir valores de IA o valores de USDA
8. app envía al backend el resultado final confirmado (con `usdaFdcId` si el usuario eligió USDA)

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

## 13. Integración USDA FoodData Central

### Motivación
La IA estima macros "a ciegas" a partir de una imagen. USDA FoodData Central es una base de datos nutricional oficial del USDA que permite cruzar esa estimación con datos reales por alimento.

### Arquitectura
- La búsqueda corre en el **backend** (proxy): `GET /api/v1/usda/search?query=...`
- La API key USDA vive en el servidor como `USDA_API_KEY` (nunca en el cliente)
- Sin clave configurada, usa `DEMO_KEY` (gratis, limitada a 30 req/hora/IP)
- USDA API base URL: `https://api.nal.usda.gov/fdc/v1`

### Flujo en el frontend
1. Análisis IA completa → modal de confirmación se abre inmediatamente
2. En paralelo (sin bloquear): `GET /api/v1/usda/search?query={título del plato}`
3. Si USDA retorna resultados, aparece sección de comparación en el modal
4. El usuario puede tocar un item USDA → el formulario se pre-llena con esos macros
5. El usuario puede volver a valores IA con "Volver a valores IA"
6. Al guardar: si eligió USDA, el `fdcId` se envía en el campo `usdaFdcId` de `POST /meals/photo`

### Comportamiento ante fallos
- Si USDA falla (timeout, error de red, 4xx/5xx): retorna lista vacía, no muestra sección USDA, no bloquea el guardado
- El campo `usda_fdc_id` en `meal_entry` es siempre opcional

### Valores nutricionales USDA
Los valores son **por 100g**. El usuario debe considerar esto al elegir (si la porción real difiere de 100g, puede editar los valores antes de confirmar).

### Nutrient IDs usados
| Nutriente | ID USDA |
|---|---|
| Energía (kcal) | 1008 |
| Proteínas (g) | 1003 |
| Carbohidratos (g) | 1005 |
| Grasas totales (g) | 1004 |
