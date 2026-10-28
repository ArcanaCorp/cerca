# Generación de compañeros CERCA mediante IA

- La nueva identidad la genera OpenRouter con el endpoint `POST /api/companion`; no existe catálogo de nombres, humor o hobbies en el cliente.
- Configura `EXPO_PUBLIC_CERCA_API_URL=https://tu-api.vercel.app` en CERCA.
- El backend debe ser **CERCA Voice API v1.1 (OpenRouter + Groq)**, con `OPENROUTER_API_KEY` configurada en el servidor.
- Antes de enviar nombre, idioma e intereses, Creating Friend solicita consentimiento específico.
- La app valida la respuesta y guarda el nombre, los intereses, Big Five y el humor en SQLite una única vez.
- Si ya había compañero creado con versiones antiguas, se conserva y no se reescribe. Para probar una identidad nueva usa Configuración > Eliminar mis datos, entendiendo que esa operación borra todo el perfil y la memoria.
- No hay alternativa local con listas o aleatoriedad si falla OpenRouter: se presenta la opción de reintento.
- El consentimiento para **audio** se solicita por separado al hablar por primera vez.
- El servidor requiere cuotas externas antes de exponerlo públicamente y no debe distribuir secretos en Expo.
