# DevOps, Entornos y Despliegue

## 1. Objetivo
Definir un setup mínimo pero ordenado para desarrollo, staging y producción.

## 2. Entornos
- local
- staging opcional
- production

## 3. Desarrollo local

### Backend
- Spring Boot local
- Postgres local con Docker
- Flyway ejecutando migraciones
- variables de entorno en `.env` o configuración externa

### Frontend
- Expo local
- emulador Android o dispositivo físico
- configuración de OAuth de Google para dev

## 4. Producción
- backend desplegado en Render, Railway, Fly.io o similar
- base de datos productiva en Supabase Postgres
- no usar Postgres en el mismo servidor productivo del backend para este MVP
- TLS obligatorio
- secretos manejados por la plataforma

## 5. Variables de entorno backend
Ejemplo:
```text
SPRING_PROFILES_ACTIVE=prod
DB_HOST=...
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
JWT_EXPIRATION_SECONDS=3600
GOOGLE_CLIENT_ID=...
GOOGLE_ALLOWED_ISSUERS=...
```

## 6. Variables de entorno frontend
Ejemplo:
```text
EXPO_PUBLIC_API_BASE_URL=https://api.tuapp.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
```

## 7. Docker backend
Archivo recomendado:
- `Dockerfile`
- `.dockerignore`

No incluir Postgres productivo dentro del mismo contenedor del backend.

## 8. CI/CD recomendado
- ejecutar tests backend
- ejecutar lint frontend
- validar migraciones Flyway
- build del backend
- build de APK/AAB cuando corresponda

## 9. Observabilidad mínima
- logs estructurados en backend
- health endpoint
- métricas básicas
- captura de errores del frontend

## 10. Backups
Al usar Supabase en producción:
- aprovechar backups/recuperación de la plataforma según plan
- complementar exportaciones periódicas si el negocio crece

## 11. Criterios de aceptación
- backend arranca local con Docker Postgres
- backend conecta a Supabase en prod
- variables sensibles no viven hardcodeadas
- health check disponible
- migraciones reproducibles
