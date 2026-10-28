# CERCA: voz y memoria (MVP por turnos)

Esta primera etapa implementa: **pulsar para hablar → transcribir → responder con IA → sintetizar voz en el teléfono**. No es conversación de baja latencia por WebRTC, ni admite interrupciones de audio mientras se está enviando una grabación.

## Requisitos

1. Ejecuta `npx expo install expo-file-system` en el proyecto y confirma `npx expo install --check`.
2. Despliega este repositorio (o el directorio `api/`) como proyecto Node en **Vercel**. El handler `api/voice-turn.js` debe responder a `POST /api/voice-turn`.
3. En **Environment Variables** de Vercel: define `OPENAI_API_KEY` **solo** en servidor. Opcionales: `OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe` y `OPENAI_TEXT_MODEL=gpt-6-luna`.
4. En el proyecto Expo crea `.env.local` con `EXPO_PUBLIC_CERCA_API_URL=https://tu-dominio-real.vercel.app`. Reinicia Expo después de configurar el entorno.
5. Abre Home en Android, pulsa el micrófono, **acepta el consentimiento de procesamiento externo** y mantén un diálogo de máximo 20 segundos.
6. Pronuncia: «Recuerda que prefiero el té verde». Verifica en SQLite la tabla `memory_facts`. Regresa a CERCA y pregúntale qué prefieres.
7. Desde Settings, borra recuerdos y verifica que desaparecen `conversation_turns` y `memory_facts`.

## Privacidad y límites

- La identidad, el historial textual y los recuerdos se guardan en SQLite del dispositivo. **No están cifrados** todavía.
- El audio se graba en caché, se envía tras consentimiento y se elimina localmente una vez procesado (o cuando se detecta un error). No guardamos archivos de voz en la base.
- El servicio Vercel recibe el audio, el contexto breve y recuerdos para procesarlos con OpenAI. No usa una base de datos propia. El API de OpenAI podría conservar datos temporalmente conforme a sus políticas. `store: false` desactiva el almacenamiento de estado de Responses, pero **no implica retención cero**.
- Solo se añaden hechos a `memory_facts` cuando el usuario pide explícitamente recordar algo; los mensajes recientes se guardan como historial. El historial no equivale a una memoria semántica avanzada.
- **Antes de exponer públicamente `/api/voice-turn`** incorpora autenticación de usuario o de instalación, cuotas y limitación de tasa en el servidor. El endpoint no tiene autenticación en este prototipo: cualquier persona que conozca la URL podría consumir tu crédito de API.
- La eliminación en Settings borra textos y recuerdos locales, pero no puede eliminar datos enviados previamente al proveedor externo.
- **No pongas una clave privada en `.env` con prefijo `EXPO_PUBLIC_`**: esas variables se incluyen en la app.
- Para una experiencia genuinamente en tiempo real: implementar transporte de audio de baja latencia (Realtime/WebRTC), manejo de interrupciones y VAD, y mantener la memoria y el consentimiento actuales.
