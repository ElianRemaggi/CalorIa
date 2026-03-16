# Autenticación con Google + JWT propio

## 1. Objetivo
Reducir fricción de entrada permitiendo login con Google y mantener control de autorización en backend usando un JWT propio de la aplicación.

## 2. Flujo recomendado
1. usuario toca "Continuar con Google" en la app
2. Expo obtiene identidad/token de Google
3. frontend envía al backend el token de Google o id token
4. backend valida el token contra Google
5. backend busca usuario por google_id o email
6. si no existe, crea usuario
7. backend emite JWT propio
8. frontend usa ese JWT para todas las llamadas posteriores

## 3. Responsabilidades del frontend
- iniciar el flujo OAuth de Google
- capturar `id_token`
- enviarlo al backend
- almacenar el JWT propio de la app en almacenamiento seguro
- manejar logout local

## 4. Responsabilidades del backend
- validar token recibido
- mapear claims confiables:
  - sub
  - email
  - name
  - picture
- crear o actualizar usuario
- emitir JWT
- exponer endpoint de refresh si se implementa

## 5. Endpoints mínimos
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/refresh` opcional
- `POST /api/v1/auth/logout` opcional

## 6. Request ejemplo
```json
{
  "idToken": "GOOGLE_ID_TOKEN"
}
```

## 7. Response ejemplo
```json
{
  "accessToken": "APP_JWT",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "fullName": "Nombre Apellido",
    "avatarUrl": "https://...",
    "onboardingCompleted": false
  }
}
```

## 8. Recomendaciones de seguridad
- validar issuer y audience del token de Google
- no confiar en datos del cliente sin validar token
- emitir JWT corto
- rotar secret/keys del backend correctamente
- no mezclar el token de Google con autorización interna
- sanitizar logs

## 9. Claims mínimos del JWT propio
- sub: user id interno
- email
- roles si aplica
- iat
- exp

## 10. Casos a contemplar
- email no verificado
- token expirado
- usuario existente por email pero sin google_id
- actualización de avatar/nombre
- usuario eliminado o bloqueado en el futuro

## 11. Logout
En MVP puede ser logout local:
- eliminar JWT del dispositivo
- limpiar cache
- limpiar datos sensibles
No es obligatorio invalidar server-side salvo que implementes refresh tokens o blacklist.

## 12. Criterios de aceptación
- login con Google en Android funciona
- backend valida token y emite JWT propio
- usuario se crea automáticamente en primer login
- usuario existente puede volver a entrar
- JWT protege endpoints privados
