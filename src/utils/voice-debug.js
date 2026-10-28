// Trazas de desarrollo: NO imprimas audio, nombres, conversación, tokens ni secretos.
const DEBUG = __DEV__ && process.env.EXPO_PUBLIC_CERCA_DEBUG === "true";

export function debugVoice(step, details = {}) {
    if (!DEBUG) return;
    console.log("[CERCA:VOICE]", step, details);
}

export function debugVoiceError(step, error) {
    if (!__DEV__) return;
    console.warn("[CERCA:VOICE]", step, {
        name: error?.name || "Error",
        message: error?.message || "Error desconocido",
        status: error?.status ?? null,
        code: error?.code ?? null,
        requestId: error?.requestId ?? null,
    });
}
