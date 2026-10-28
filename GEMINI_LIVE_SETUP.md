# CERCA — Gemini Live, audio continuo

## Arquitectura
- Captura: `expo-audio` `useAudioStream`, PCM16 mono 16 kHz.
- Transporte: WebSocket a Google con token efímero emitido en `POST /api/live-session` por `ArcanaCorp/cerca-voice-api`.
- Salida: PCM16 mono 24 kHz por `react-native-audio-api`, `AudioBufferQueueSourceNode`.
- Interrupciones: el evento `interrupted` vacía la cola de reproducción.
- Memoria: conserva SQLite local, recupera contexto al iniciar y guarda los turnos transcritos. Solo memoriza frases explícitas no sensibles.
- Respaldo: `useVoiceConversation.js` con OpenRouter/Groq por turnos cuando Live esté desactivado o falle.

## Activación
1. Fusiona y despliega el PR de CERCA Voice API que añade `POST /api/live-session`.
2. En Vercel añade `GEMINI_API_KEY`, `GEMINI_LIVE_MODEL` (elige un modelo Live habilitado en Google AI Studio), Upstash Redis y RATE_LIMIT_SALT. Nunca pongas esas claves en Expo.
3. En CERCA crea `.env.local` con:
   ```env
   EXPO_PUBLIC_CERCA_API_URL=https://tu-api.vercel.app
   EXPO_PUBLIC_CERCA_LIVE_ENABLED=true
   ```
4. Ejecuta `npx expo install react-native-audio-api` si necesitas sincronizar versiones locales. Instala `npx expo install expo-dev-client` solo para usar el perfil `development`.
5. Para probar una APK autónoma (sin Android Studio), ejecuta `npx eas-cli@latest build --platform android --profile preview`. Para desarrollo con Metro, tras instalar `expo-dev-client`, usa `npx eas-cli@latest build --platform android --profile development`. No basta Expo Go.
6. En Home pulsa una vez el micrófono, concede consentimiento específico para Gemini y habla naturalmente. Pulsa otra vez para finalizar. Prueba inicialmente con audífonos para reducir el eco.
7. Prueba «Recuerda que prefiero el té verde», espera la respuesta, cierra la sesión y vuelve a preguntar en otra sesión.

## Límites
- Token efímero de un uso; 60 segundos para conectarse y como máximo 10 minutos de validez para esa sesión.
- Gemini Live puede consumir cuota o tener cargos según el modelo y la cuenta. Comprueba el nivel gratuito real en AI Studio antes de activar para usuarios externos.
- La clave permanente queda en Vercel, pero el backend anónimo aún requiere controles por instalación/usuario y presupuesto antes de producción. Upstash limita emisión de tokens, no el consumo minuto a minuto.
- PCM no se guarda en SQLite; solo texto y recuerdos locales. La base aún no está cifrada.
- La transcripción es asíncrona: si un turno no tiene transcripción completa, se omite de la memoria. El filtrado de información sensible es limitado.
- El eco, el audio duplex y la ruta altavoz deben probarse en Android físico. No hay reanudación de sesiones desconectadas en este MVP.
- Se requiere despliegue real del servidor, claves válidas y pruebas de dispositivo para afirmar que funciona de extremo a extremo.
