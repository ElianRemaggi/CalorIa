# Roadmap de Implementación y Criterios de Aceptación

## 1. Orden recomendado de construcción

### Fase A - Base técnica
- bootstrap frontend Expo
- bootstrap backend Spring Boot
- configurar Postgres local
- configurar Flyway
- definir DTOs base
- definir diseño de tablas

### Fase B - Auth
- login Google en frontend
- endpoint `/auth/google`
- emisión de JWT propio
- middleware de autenticación
- endpoint `/users/me`

### Fase C - Onboarding y perfil
- pantalla onboarding
- `PUT /profile/me`
- cálculo de metas
- `GET /profile/me`

### Fase D - Dashboard e historial
- `GET /dashboard`
- `GET /history/daily`
- `GET /history/weekly`
- `GET /history/monthly`

### Fase E - Meals manuales
- pantalla carga manual
- `POST /meals/manual`
- listado del día
- edición y borrado

### Fase F - Meals photo con IA
- settings de proveedor + API key
- integración con un proveedor primero
- preview editable
- `POST /meals/photo`
- persistencia de debug IA

### Fase G - Notificaciones
- settings de recordatorios
- notificaciones locales
- persistencia de preferencias

### Fase H - Hardening
- manejo global de errores
- tests
- pulido de UX
- deploy MVP

## 2. Recomendación de prioridad técnica
Empezar por:
1. auth
2. perfil
3. meals manuales
4. dashboard/historial
5. IA por foto
6. notificaciones

Esto permite tener producto usable antes de la parte más inestable del sistema: la IA multimodal.

## 3. Definition of Done por módulo

### Auth
- usuario puede entrar con Google
- backend emite JWT válido
- endpoints privados protegidos

### Perfil
- onboarding persistido
- metas calculadas correctamente

### Meals manuales
- se pueden crear, listar, editar y borrar meals

### Meals photo
- IA devuelve estructura usable
- usuario puede corregir
- backend guarda estimado y final

### Dashboard
- muestra consumido y restante de calorías/macros

### Historial
- consulta por día, semana y mes funcional

### Settings
- proveedor y API key configurables
- notificaciones persistidas

## 4. Riesgos de implementación
- OAuth Android
- respuestas inconsistentes de IA
- duplicar lógica entre frontend y backend
- problemas de zona horaria en historial
- edición incorrecta de macros/finales

## 5. Recomendaciones para Claude
- generar primero la base del backend y contratos
- no sobreingenierizar
- no crear microservicios
- respetar separación modular
- priorizar código legible y mantenible
- escribir migraciones SQL explícitas
- usar DTOs de request/response bien definidos
- mantener consistencia entre tipos frontend y contratos API

## 6. Entregable esperado
Un MVP ejecutable con:
- frontend Expo
- backend Spring Boot
- DB relacional
- auth con Google
- meals manuales y photo
- dashboard
- historial
- settings
