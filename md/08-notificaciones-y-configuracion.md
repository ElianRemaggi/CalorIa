# Notificaciones y Configuración

## 1. Objetivo
Dar al usuario control sobre recordatorios y configuración técnica sin cargar el MVP con automatizaciones complejas.

## 2. Configuración de notificaciones
El usuario podrá definir:
- habilitado general
- recordatorio de desayuno
- recordatorio de almuerzo
- recordatorio de cena
- recordatorio de snack
- máximo de notificaciones por día

## 3. Implementación inicial
Frontend:
- Expo Notifications
- permisos del sistema
- almacenamiento de token del dispositivo si más adelante se necesita push server-side

Backend:
- persistencia de preferencias
- sin orquestación compleja en MVP si las notificaciones son locales

## 4. Recomendación
Para el MVP usar notificaciones locales en el dispositivo. Esto reduce complejidad y evita backend adicional para scheduling.

## 5. Configuración de IA
Pantalla de settings debe permitir:
- elegir proveedor
- ingresar API key
- guardar API key local en SecureStore
- leer disclaimer de privacidad

## 6. Disclaimer sugerido
```text
Tu API key se almacena únicamente en este dispositivo y no se envía ni guarda en nuestros servidores.
```

## 7. Configuración de perfil
Permitir:
- editar peso
- editar altura
- editar edad
- editar objetivo
- recalcular metas

## 8. Configuración futura
- unidades métricas/imperiales
- idioma
- tema oscuro
- sincronización de dispositivo
- favoritos/comidas frecuentes

## 9. Criterios de aceptación
- usuario puede activar/desactivar recordatorios
- preferencias persisten
- API key se guarda localmente
- cambio de proveedor IA persiste
- editar perfil recalcula metas correctamente
