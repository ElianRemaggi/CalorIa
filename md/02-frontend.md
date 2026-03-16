# Frontend Mobile - React Native + Expo

## 1. Objetivo
Construir una app mobile-first con una sola base de código, optimizada inicialmente para Android y preparada para futuro soporte iOS.

## 2. Stack recomendado
- React Native
- Expo
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Expo SecureStore
- Expo Notifications
- Expo ImagePicker
- Expo Camera
- date-fns

## 3. Estructura sugerida
```text
src/
  app/
    (auth)/
    (onboarding)/
    (tabs)/
    meal/
    settings/
  components/
  features/
    auth/
    onboarding/
    dashboard/
    meals/
    history/
    settings/
    notifications/
    ai/
  services/
    api/
    auth/
    ai/
    storage/
  hooks/
  store/
  utils/
  types/
  constants/
```

## 4. Módulos del frontend

### auth
Responsabilidades:
- iniciar sesión con Google
- persistir sesión del backend
- logout
- refresco de sesión si aplica

### onboarding
Responsabilidades:
- capturar género, edad, altura, peso y objetivo
- validar formulario
- enviar datos al backend
- redirigir al dashboard al completar

### dashboard
Responsabilidades:
- mostrar calorías consumidas
- mostrar calorías restantes
- mostrar macros consumidos/restantes
- acceso rápido a registrar comida

### meals
Responsabilidades:
- registrar comida por foto
- registrar comida manual
- mostrar preview de resultado IA
- permitir confirmación/edición
- guardar comida en backend

### history
Responsabilidades:
- vista diaria
- vista semanal
- vista mensual
- detalle de cada comida registrada

### settings
Responsabilidades:
- seleccionar proveedor IA
- guardar API key en SecureStore
- editar perfil
- configurar notificaciones
- ver disclaimers de privacidad

## 5. Pantallas mínimas
- Splash / bootstrap
- Login
- Onboarding
- Dashboard
- Registrar comida
- Resultado IA y edición
- Carga manual
- Historial
- Detalle de día
- Settings
- Perfil
- Notificaciones
- Proveedor IA

## 6. Flujo principal de comida por foto
1. usuario toca "Registrar comida"
2. elige "Foto"
3. selecciona o toma imagen
4. el frontend la comprime temporalmente
5. obtiene API key local desde SecureStore
6. llama al proveedor IA desde el cliente
7. recibe JSON estructurado
8. muestra preview editable
9. usuario confirma o corrige
10. frontend envía al backend solo resultado estructurado, sin imagen

## 7. Flujo principal de comida manual
1. usuario toca "Registrar comida"
2. elige "Manual"
3. completa nombre, calorías y macros
4. opcionalmente agrega descripción
5. confirma
6. frontend envía el registro al backend

## 8. Gestión de estado
- sesión de usuario: Zustand
- proveedor IA seleccionado: Zustand + SecureStore
- API key: SecureStore
- cache de datos remotos: TanStack Query
- formularios: React Hook Form + Zod

## 9. Reglas de UX
- el tiempo de registro debe ser bajo
- el usuario siempre debe poder editar el resultado IA
- dejar claro cuándo un valor es estimado
- mostrar errores de red y de IA con mensajes comprensibles
- nunca mostrar la API key en texto plano sin intención explícita
- el dashboard debe ser legible en pocos segundos

## 10. Seguridad
- no guardar API keys en AsyncStorage
- usar SecureStore
- no enviar API key al backend
- no loguear API key en consola
- limpiar imágenes temporales cuando corresponda

## 11. Contratos internos recomendados
Tipos TypeScript:
- UserSession
- UserProfile
- DashboardSummary
- MealEntry
- MealCreatePayload
- ManualMealPayload
- AIAnalysisResult
- NotificationPreferences
- AIProviderConfig

## 12. Criterios de aceptación del frontend
- login con Google funcional
- onboarding funcional
- dashboard con datos reales
- carga de comida por foto y manual
- edición manual pre-guardado
- historial navegable
- configuración de notificaciones funcional
- almacenamiento local seguro de API key
