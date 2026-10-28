import { File } from "expo-file-system";
import { debugVoice, debugVoiceError } from "../utils/voice-debug";

const MAX_AUDIO_BYTES = 2_500_000;

function apiEndpoint() {
    const url = process.env.EXPO_PUBLIC_CERCA_API_URL?.trim()?.replace(/\/$/, "");
    if (!url || !url.startsWith("https://")) {
        throw new Error(
            "Configura EXPO_PUBLIC_CERCA_API_URL con la URL HTTPS del servicio de voz."
        );
    }
    return `${url}/api/voice-turn`;
}

// No almacena el audio en servidor: solo envía el archivo temporal de la grabación.
export async function requestVoiceTurn({ uri, user, companion, context, signal }) {
    if (!uri) throw new Error("No se encontró la grabación de voz.");

    const file = new File(uri);
    if (!file.exists || file.size === 0) {
        throw new Error("La grabación está vacía. Inténtalo de nuevo.");
    }
    if (file.size > MAX_AUDIO_BYTES) {
        throw new Error("Audio demasiado largo. Usa mensajes de hasta 20 segundos.");
    }

    debugVoice("audio_file_validated", { bytes: file.size });
    const audio = await file.base64();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
        const sentAt = Date.now();
        debugVoice("api_request_start", { audioBytes: file.size, historyCount: context.history.length, memoryCount: context.memories.length });
        const response = await fetch(apiEndpoint(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                audio,
                mimeType: "audio/mp4",
                user: {
                    name: user.name,
                    language: user.language,
                    interests: user.interests,
                },
                companion: {
                    name: companion.name,
                    gender: companion.gender,
                    personality: companion.personality,
                    interests: companion.interests,
                    humor: companion.humor,
                    communicationStyle: companion.communicationStyle,
                },
                memories: context.memories,
                history: context.history,
            }),
            signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        const requestId = response.headers?.get?.("X-CERCA-Request-ID") || data.requestId || null;
        debugVoice("api_response", {
            status: response.status, code: data.code || null, requestId,
            elapsedMs: Date.now() - sentAt,
        });

        if (!response.ok) {
            const error = new Error(data.error || "No pudimos procesar tu voz en este momento.");
            error.status = response.status;
            error.code = data.code || "unknown_error";
            error.requestId = requestId;
            throw error;
        }

        if (typeof data.transcript !== "string" || typeof data.reply !== "string") {
            throw new Error("La respuesta del servicio de voz no es válida.");
        }

        debugVoice("api_result_validated", { transcriptChars: data.transcript.length, replyChars: data.reply.length, hasMemory: Boolean(data.memory) });
        return {
            transcript: data.transcript.trim(),
            reply: data.reply.trim(),
            memory: typeof data.memory === "string" ? data.memory : "",
        };
    } catch (error) {
        debugVoiceError("api_request_failed", error);
        if (error.name === "AbortError") {
            throw new Error("La respuesta tardó demasiado. Vuelve a intentarlo.");
        }
        throw error;
    } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", cancel);
    }
}

export function deleteTemporaryRecording(uri) {
    if (!uri) return;
    try {
        const file = new File(uri);
        if (file.exists) file.delete();
    } catch (error) {
        console.warn("No pudimos borrar el audio temporal:", error);
    }
}
