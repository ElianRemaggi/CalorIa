# Backend - Spring Boot

## 1. Objetivo
Construir una API REST monolítica modular con Spring Boot, enfocada en reglas de negocio, autenticación, persistencia y agregados de historial.

## 2. Stack recomendado
- Java 21
- Spring Boot 3.x
- Spring Web
- Spring Security
- Spring Data JPA
- Bean Validation
- OAuth2 Resource Server o integración manual de tokens
- PostgreSQL Driver
- Flyway
- Lombok opcional
- MapStruct opcional
- springdoc-openapi
- Testcontainers
- JUnit 5

## 3. Estilo arquitectónico
Monolito modular. Evitar microservicios en el MVP.

## 4. Paquetes sugeridos
```text
com.tuapp
  config
  common
  auth
  user
  profile
  meal
  dashboard
  history
  notification
  analytics
```

## 5. Módulos del backend

### auth
Responsabilidades:
- validar identidad Google enviada por el cliente
- crear usuario si no existe
- emitir JWT propio
- refrescar sesión si aplica
- logout lógico si se implementa

### user
Responsabilidades:
- leer datos del usuario autenticado
- actualizar datos base
- exponer perfil público mínimo

### profile
Responsabilidades:
- crear y actualizar perfil nutricional
- calcular objetivos diarios
- recalcular al cambiar peso/objetivo

### meal
Responsabilidades:
- crear meals manuales
- crear meals desde resultado IA
- editar meals
- borrar meals
- distinguir valores estimados y finales

### dashboard
Responsabilidades:
- agregar calorías y macros por día
- calcular restante diario
- exponer resumen del día actual y fecha consultada

### history
Responsabilidades:
- listar comidas por día
- agrupar por semana
- agrupar por mes

### notification
Responsabilidades:
- guardar preferencias de recordatorios
- exponer configuración de notificaciones del usuario
- más adelante soportar jobs/scheduling si se usan push server-side

### analytics
Responsabilidades:
- métricas internas
- más adelante eventos de uso

## 6. Estructura por módulo recomendada
```text
module/
  controller/
  service/
  repository/
  domain/
  dto/
  mapper/
```

## 7. Reglas de dominio clave
- un usuario puede tener un único perfil activo
- el perfil define objetivos diarios
- cada meal debe guardar:
  - origen: manual o photo
  - calorías/macros estimados
  - calorías/macros finales
- un meal de origen photo no guarda imagen persistente en MVP
- el dashboard se calcula sobre valores finales confirmados
- si no hay corrección manual, valor final = valor estimado

## 8. Cálculo de metas
Backend debe centralizar:
- BMR estimado
- TDEE aproximado
- ajuste por objetivo: bajar / mantener / subir
- distribución sugerida de macros

Importante:
- estos cálculos deben encapsularse en una clase de dominio o servicio dedicado
- no duplicarlos en frontend

## 9. Seguridad
- endpoints protegidos por JWT propio
- el frontend autentica contra Google y luego obtiene token de la app
- no almacenar API keys del usuario
- no recibir API keys del usuario
- logs sanitizados

## 10. Persistencia
- JPA/Hibernate
- migraciones con Flyway
- convenciones snake_case en DB
- entidades claras y sin acoplar directamente el API contract

## 11. Errores y manejo de excepciones
Implementar:
- GlobalExceptionHandler
- errores de validación
- errores de autenticación
- not found
- forbidden
- conflict
- error interno

Formato recomendado:
```json
{
  "timestamp": "2026-03-16T12:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": []
}
```

## 12. Testing
- unit tests en servicios de dominio
- integration tests con Testcontainers
- pruebas de seguridad de endpoints
- pruebas de migraciones Flyway

## 13. Criterios de aceptación del backend
- login con Google crea o recupera usuario correctamente
- JWT propio emitido y validado
- perfil nutricional persistido
- meals manuales y photo persistidos
- dashboard diario correcto
- historial diario/semanal/mensual correcto
- preferencias de notificaciones persistidas
