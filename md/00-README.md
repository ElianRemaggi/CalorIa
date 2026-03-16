# Proyecto SaaS Mobile de Conteo de Calorías y Macros

Este paquete contiene la documentación base del proyecto para que un modelo de desarrollo pueda generar el código con una guía clara y consistente.

## Objetivo del producto
Construir una app mobile-first para Android (dejando la puerta abierta a iOS) que permita a un usuario:

- registrarse e iniciar sesión con Google
- completar su perfil nutricional
- registrar comidas por foto o manualmente
- obtener una estimación de calorías y macros usando IA
- corregir manualmente el resultado
- visualizar su progreso diario, semanal y mensual

## Restricciones del MVP
- no se almacenarán fotos de comidas de forma persistente
- la API key del proveedor de IA será provista por el usuario
- la API key se guarda solo localmente en el dispositivo
- el backend será Spring Boot
- la base de datos productiva será Supabase Postgres
- el público objetivo inicial es general, no clínico

## Estructura de documentos
- `01-producto-y-alcance.md`: visión del producto, alcance y MVP
- `02-frontend.md`: arquitectura y módulos del frontend mobile
- `03-backend.md`: arquitectura y módulos del backend Spring Boot
- `04-base-de-datos.md`: modelo relacional, tablas, índices y migraciones
- `05-auth-google.md`: autenticación con Google + JWT propio
- `06-ia-y-procesamiento.md`: integración con OpenAI, Gemini y Claude
- `07-api-contratos.md`: endpoints REST del MVP
- `08-notificaciones-y-configuracion.md`: recordatorios y preferencias
- `09-devops-entornos.md`: entornos, despliegue y configuración
- `10-roadmap-y-criterios.md`: roadmap de implementación y aceptación

## Principios de diseño
- priorizar velocidad de validación sin romper escalabilidad
- mantener un monolito modular en backend
- evitar sobreingeniería
- dejar preparado el proyecto para iOS en frontend
- dejar preparado el backend para migrar de BYOK a IA propia
- separar claramente lógica de presentación, negocio y persistencia

## Decisiones ya tomadas
- frontend: React Native + Expo + TypeScript
- backend: Spring Boot
- base de datos: Supabase Postgres
- auth: Google Sign-In + JWT de la app
- storage de fotos: no en MVP
- seguimiento: calorías + macros
- carga de comida: foto y manual
- historial: diario, semanal y mensual
- objetivo del usuario: bajar, subir o mantener peso
