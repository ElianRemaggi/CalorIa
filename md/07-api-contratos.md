# Contratos API REST del MVP

## 1. Convenciones
- prefijo: `/api/v1`
- auth con `Authorization: Bearer <token>`
- JSON en request/response
- timestamps ISO-8601 UTC

## 2. Auth

### POST /api/v1/auth/google
Intercambia el token de Google por un JWT propio.

Request:
```json
{
  "idToken": "GOOGLE_ID_TOKEN"
}
```

Response:
```json
{
  "accessToken": "APP_JWT",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "fullName": "Nombre",
    "avatarUrl": "https://...",
    "onboardingCompleted": false
  }
}
```

## 3. Perfil

### GET /api/v1/profile/me
Devuelve el perfil del usuario autenticado.

### PUT /api/v1/profile/me
Crea o actualiza el perfil nutricional.

Request:
```json
{
  "gender": "male",
  "age": 31,
  "heightCm": 176,
  "weightKg": 82,
  "goalType": "lose"
}
```

Response:
```json
{
  "userId": "uuid",
  "gender": "male",
  "age": 31,
  "heightCm": 176,
  "weightKg": 82,
  "goalType": "lose",
  "targetCalories": 2100,
  "targetProteinG": 150,
  "targetCarbsG": 180,
  "targetFatG": 70,
  "onboardingCompleted": true
}
```

## 4. Dashboard

### GET /api/v1/dashboard?date=2026-03-16
Response:
```json
{
  "date": "2026-03-16",
  "targetCalories": 2100,
  "consumedCalories": 980,
  "remainingCalories": 1120,
  "targetProteinG": 150,
  "consumedProteinG": 55,
  "remainingProteinG": 95,
  "targetCarbsG": 180,
  "consumedCarbsG": 92,
  "remainingCarbsG": 88,
  "targetFatG": 70,
  "consumedFatG": 30,
  "remainingFatG": 40
}
```

## 5. Meals

### POST /api/v1/meals/manual
Request:
```json
{
  "title": "Yogur con banana",
  "description": "Desayuno simple",
  "mealDateTime": "2026-03-16T08:30:00Z",
  "finalCalories": 280,
  "finalProteinG": 12,
  "finalCarbsG": 38,
  "finalFatG": 7
}
```

### POST /api/v1/meals/photo
Request:
```json
{
  "title": "Arroz con pollo",
  "description": "Se observan arroz, pollo y verduras.",
  "mealDateTime": "2026-03-16T13:10:00Z",
  "estimatedCalories": 620,
  "estimatedProteinG": 38,
  "estimatedCarbsG": 70,
  "estimatedFatG": 18,
  "finalCalories": 590,
  "finalProteinG": 35,
  "finalCarbsG": 66,
  "finalFatG": 17,
  "aiProvider": "openai",
  "aiDebug": {
    "promptText": "....",
    "rawResponse": "{...}",
    "parsedResponse": {
      "title": "Arroz con pollo",
      "description": "Se observan arroz, pollo y verduras.",
      "estimatedCalories": 620,
      "estimatedProteinG": 38,
      "estimatedCarbsG": 70,
      "estimatedFatG": 18
    }
  }
}
```

### GET /api/v1/meals?date=2026-03-16
Lista las comidas de un día.

### PUT /api/v1/meals/{mealId}
Actualiza un registro.

### DELETE /api/v1/meals/{mealId}
Elimina un registro.

## 6. Historial

### GET /api/v1/history/daily?date=2026-03-16
### GET /api/v1/history/weekly?weekStart=2026-03-16
### GET /api/v1/history/monthly?year=2026&month=3

## 7. Peso

### POST /api/v1/weight-logs
```json
{
  "weightKg": 81.4,
  "loggedAt": "2026-03-16"
}
```

### GET /api/v1/weight-logs
Devuelve historial de peso.

## 8. Notificaciones

### GET /api/v1/notification-settings
### PUT /api/v1/notification-settings
```json
{
  "enabled": true,
  "breakfastReminderEnabled": true,
  "lunchReminderEnabled": true,
  "dinnerReminderEnabled": true,
  "snackReminderEnabled": false,
  "maxNotificationsPerDay": 3
}
```

## 9. Usuario

### GET /api/v1/users/me
Devuelve datos básicos del usuario autenticado.

## 10. Errores estándar
```json
{
  "timestamp": "2026-03-16T12:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": [
    {
      "field": "goalType",
      "message": "must be one of lose, maintain, gain"
    }
  ]
}
```
