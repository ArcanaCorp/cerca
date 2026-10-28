import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useAudioStream, requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";
import { AudioContext } from "react-native-audio-api";

import { useApp } from "./useApp";
import { useVoiceConversation } from "./useVoiceConversation";
import { getLiveSession } from "../services/live.service";
import { makeLiveInstructions } from "../services/live-prompt";
import { getConversationContext, saveConversation } from "../services/memory.service";
import { getGeminiLiveConsent, setGeminiLiveConsent } from "../services/profile.service";

const { createPcmConverter, explicitMemoryFromTranscript } = require("../utils/pcm-live");

const LIVE_ENABLED = process.env.EXPO_PUBLIC_CERCA_LIVE_ENABLED === "true";
const START_TIMEOUT_MS = 18000;

export function useLiveConversation() {
    const { user, companion } = useApp();
    // Conserva el motor OpenRouter/Groq sin crear una segunda identidad.
    const legacy = useVoiceConversation();
    const [mode, setMode] = useState(LIVE_ENABLED ? "live" : "legacy");
    const [phase, setPhase] = useState("idle");
    const [error, setError] = useState(null);

    const sessionRef = useRef(null);
    const startAbortRef = useRef(null);
    const mountedRef = useRef(true);
    const pcmRef = useRef(createPcmConverter());
    const busyRef = useRef(false);

    const handlePcm = useCallback((buffer) => {
        const session = sessionRef.current;
        if (!session?.active || !session.ready || session.ws?.readyState !== WebSocket.OPEN) return;
        if (session.ws.bufferedAmount > 256_000) return;

        try {
            for (const data of pcmRef.current(buffer)) {
                if (session.ws.bufferedAmount > 256_000) break;
                session.ws.send(JSON.stringify({
                    realtimeInput: {
                        audio: { data, mimeType: "audio/pcm;rate=16000" }
                    }
                }));
            }
        } catch (reason) {
            console.warn("CERCA Live: PCM capture failed", reason?.message);
        }
    }, []);

    const { stream } = useAudioStream({
        sampleRate: 16000,
        channels: 1,
        encoding: "int16",
        onBuffer: handlePcm,
    });

    const clearLive = useCallback(async () => {
        startAbortRef.current?.abort();
        startAbortRef.current = null;
        const session = sessionRef.current;
        sessionRef.current = null;

        if (session) {
            session.active = false;
            clearTimeout(session.timeout);
            try {
                if (session.ws && session.ws.readyState <= WebSocket.OPEN) session.ws.close();
            } catch {}
            try { session.queue?.clearBuffers(); } catch {}
            try { await session.context?.close(); } catch {}
        }
        try { await stream.stop(); } catch {}
        try {
            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            });
        } catch {}
        busyRef.current = false;
        if (mountedRef.current) setPhase("idle");
    }, [stream]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // La limpieza es asíncrona, pero no bloquea el desmontaje de la pantalla.
            clearLive().catch(() => {});
        };
    }, [clearLive]);

    const fallback = useCallback((reason) => {
        const message = reason?.message || "Gemini Live no está disponible por ahora.";
        setError(message);
        setMode("legacy");
        Alert.alert(
            "Continuar con CERCA",
            `${message}\n\nPuedes seguir conversando con OpenRouter + Groq tocando el micrófono.`
        );
    }, []);

    const start = useCallback(async () => {
        if (busyRef.current || !user || !companion) return;
        busyRef.current = true;
        setError(null);
        setPhase("connecting");
        const abort = new AbortController();
        startAbortRef.current = abort;
        try {
            const permission = await requestRecordingPermissionsAsync();
            if (!permission.granted) throw new Error("Activa el permiso del micrófono.");
            const [ticket, context] = await Promise.all([
                getLiveSession({ signal: abort.signal }),
                getConversationContext(),
            ]);
            if (abort.signal.aborted) return;

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });
            const playback = new AudioContext({ sampleRate: 24000 });
            const queue = playback.createBufferQueueSource();
            queue.connect(playback.destination);
            await playback.resume();

            const ws = new WebSocket(
                `${ticket.websocketUrl}?access_token=${encodeURIComponent(ticket.token)}`
            );
            const session = {
                ws,
                context: playback,
                queue,
                active: true,
                ready: false,
                startedQueue: false,
                generation: 0,
                decodeChain: Promise.resolve(),
                userText: "",
                replyText: "",
                timeout: null,
            };
            sessionRef.current = session;

            const settleTurn = () => {
                const transcript = session.userText.trim();
                const reply = session.replyText.trim();
                session.userText = "";
                session.replyText = "";
                if (!transcript || !reply) return;
                saveConversation({
                    transcript,
                    reply,
                    memory: explicitMemoryFromTranscript(transcript),
                }).catch(reason => {
                    console.warn("CERCA Live: unable to save local turn", reason?.message);
                });
            };

            queue.onBufferEnded = (event) => {
                if (session.active && event?.isLastBufferInQueue && mountedRef.current) {
                    setPhase("listening");
                }
            };

            session.timeout = setTimeout(() => {
                if (session.active && !session.ready) {
                    clearLive().then(() => fallback(new Error("Gemini no completó la conexión.")));
                }
            }, START_TIMEOUT_MS);

            ws.onopen = () => {
                if (!session.active) return;
                ws.send(JSON.stringify({
                    setup: {
                        model: `models/${ticket.model}`,
                        responseModalities: ["AUDIO"],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction: {
                            parts: [{ text: makeLiveInstructions(user, companion, context) }],
                        },
                    },
                }));
            };

            ws.onmessage = async (event) => {
                if (!session.active) return;
                let data;
                try { data = JSON.parse(event.data); } catch { return; }

                if (data.setupComplete || data.setup_complete) {
                    if (session.ready) return;
                    clearTimeout(session.timeout);
                    session.ready = true;
                    pcmRef.current = createPcmConverter();
                    try {
                        await stream.start();
                        if (session.active && mountedRef.current) setPhase("listening");
                    } catch (reason) {
                        await clearLive();
                        fallback(new Error("No se pudo iniciar el audio continuo."));
                    }
                    return;
                }

                const content = data.serverContent || data.server_content;
                if (!content) return;

                if (content.interrupted) {
                    session.generation += 1;
                    session.queue.clearBuffers();
                    session.replyText = "";
                    if (mountedRef.current) setPhase("listening");
                }

                const inputText = content.inputTranscription?.text || content.input_transcription?.text;
                if (inputText?.trim()) {
                    session.userText = [session.userText, inputText.trim()].filter(Boolean).join(" ").slice(-3000);
                }

                const outputText = content.outputTranscription?.text || content.output_transcription?.text;
                if (outputText?.trim()) {
                    session.replyText = [session.replyText, outputText.trim()].filter(Boolean).join(" ").slice(-3000);
                }

                const parts = content.modelTurn?.parts || content.model_turn?.parts || [];
                for (const part of parts) {
                    const audio = part.inlineData || part.inline_data;
                    if (!audio?.data || !audio.mimeType?.startsWith("audio/pcm")) continue;
                    const generation = session.generation;
                    if (mountedRef.current) setPhase("speaking");

                    session.decodeChain = session.decodeChain.then(async () => {
                        if (!session.active || generation !== session.generation) return;
                        const decoded = await playback.decodePCMInBase64(audio.data, 24000, 1);
                        if (!session.active || generation !== session.generation) return;
                        session.queue.enqueueBuffer(decoded);
                        if (!session.startedQueue) {
                            session.queue.start();
                            session.startedQueue = true;
                        }
                    }).catch(reason => {
                        console.warn("CERCA Live: audio decode failed", reason?.message);
                    });
                }

                if (content.turnComplete || content.turn_complete) {
                    settleTurn();
                }
            };

            ws.onerror = () => {
                if (!session.active) return;
                clearLive().then(() => fallback(new Error("Se interrumpió la conexión Live.")));
            };
            ws.onclose = () => {
                if (!session.active) return;
                clearLive().then(() => fallback(new Error("La sesión Live finalizó.")));
            };
        } catch (reason) {
            if (!abort.signal.aborted) {
                await clearLive();
                fallback(reason);
            }
        } finally {
            if (startAbortRef.current === abort) startAbortRef.current = null;
            busyRef.current = false;
        }
    }, [user, companion, stream, clearLive, fallback]);

    const askConsent = useCallback(async () => {
        if (busyRef.current) return;
        try {
            if (await getGeminiLiveConsent()) {
                await start();
                return;
            }
            Alert.alert(
                "Conversación en vivo",
                "Para conversar sin pausas, CERCA enviará continuamente tu voz y el contexto necesario directamente a Google Gemini mientras la sesión esté activa. La identidad y los recuerdos seguirán guardándose en este dispositivo. Puedes cancelar en cualquier momento.",
                [
                    { text: "Ahora no", style: "cancel" },
                    {
                        text: "Aceptar y conversar",
                        onPress: async () => {
                            try {
                                await setGeminiLiveConsent(true);
                                await start();
                            } catch (reason) {
                                Alert.alert("CERCA", reason.message);
                            }
                        },
                    },
                ]
            );
        } catch (reason) {
            Alert.alert("CERCA", reason.message);
        }
    }, [start]);

    const action = useCallback(() => {
        if (mode === "legacy") return legacy.action();
        if (phase === "idle") return askConsent();
        return clearLive();
    }, [mode, legacy.action, phase, askConsent, clearLive]);

    return {
        mode,
        phase: mode === "legacy" ? legacy.phase : phase,
        busy: mode === "legacy" ? legacy.busy : phase === "connecting",
        error: mode === "legacy" ? legacy.error : error,
        action,
    };
}
