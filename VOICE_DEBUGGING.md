# CERCA: detectar dónde se detiene la conversación

## Activar logs en Expo
En `.env.local`, junto a la URL del API:

```env
EXPO_PUBLIC_CERCA_API_URL=https://TU-API.vercel.app
EXPO_PUBLIC_CERCA_DEBUG=true
```

Reinicia Metro: `npx expo start --clear`. La opción solo registra pasos técnicos en desarrollo, sin audio, nombres, contenido ni claves.

## Leer los eventos

Se verán en la terminal Metro/Expo con el prefijo `[CERCA:VOICE]`:

- `recording_permission_request`, `recording_permission_result`, `recording_started`
- `recording_stopped` y `local_context_loaded` (número de mensajes y recuerdos, no contenido)
- `audio_file_validated` y `api_request_start`
- `api_response` (HTTP status, código y requestId de Vercel)
- `api_result_validated`, `conversation_saved`, `speech_start`, `speech_completed`
- `conversation_failed` incluye código, estado y requestId, sin imprimir la conversación.

## Revisar Vercel

En el proyecto `cerca-voice-api`, configura `CERCA_DEBUG_LOGS=true` como variable privada y redespliega. En **Vercel Logs** filtra `[CERCA-API]`, o el `requestId` observado en Expo.

Si aparece `quota_upstash_http_failure` con 401/403, revisa que el token y la URL provengan de la **misma base Upstash**. Con `quota_network_failure`, comprueba conexión/timeout. Si aparece `quota_upstash_invalid_result`, revisa el formato de `POST /pipeline`. No pegues claves en los logs.

El botón de micrófono sigue funcionando como antes. No uses `console.log(context)` ni `console.log(turn)`, porque esas instrucciones imprimen conversaciones reales y recuerdos.
