import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import * as Speech from "expo-speech";

import { useApp } from "./useApp";
import { getConversationContext, saveConversation } from "../services/memory.service";
import {
    requestVoiceTurn,
    deleteTemporaryRecording,
} from "../services/voice.service";
import {
    getVoiceConsent,
    setVoiceConsent,
} from "../services/profile.service";

const MAX_SECONDS = 20;

export function useVoiceConversation() {
    const { user, companion } = useApp();

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recordingState = useAudioRecorderState(recorder);

    const [phase, setPhase] = useState("idle");
    const [error, setError] = useState(null);
    const [lastReply, setLastReply] = useState("");

    const recordingRef = useRef(false);
    const mountedRef = useRef(true);
    const busyRef = useRef(false);
    const timerRef = useRef(null);
    const endRef = useRef(null);
    const networkRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            clearTimeout(timerRef.current);
            networkRef.current?.abort();
            Speech.stop();
            if (recordingRef.current) recorder.stop().catch(console.error);
        };
    }, [recorder]);

    const startRecording = useCallback(async () => {
        if (busyRef.current || !user || !companion) return;
        busyRef.current = true;

        try {
            const permission = await AudioModule.requestRecordingPermissionsAsync();
            if (!permission.granted) {
                throw new Error("Activa el permiso de micrófono para conversar.");
            }

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            await recorder.prepareToRecordAsync();
            recorder.record();
            timerRef.current = setTimeout(() => endRef.current?.(), MAX_SECONDS * 1000);

            recordingRef.current = true;
            if (mountedRef.current) {
                setLastReply("");
                setError(null);
                setPhase("listening");
            }
        } catch (reason) {
            if (mountedRef.current) {
                setError(reason.message);
                setPhase("idle");
                Alert.alert("Micrófono", reason.message);
            }
        } finally {
            busyRef.current = false;
        }
    }, [recorder, user, companion]);

    const begin = useCallback(async () => {
        if (busyRef.current || phase !== "idle") return;

        try {
            const consent = await getVoiceConsent();
            if (consent) {
                await startRecording();
                return;
            }

            Alert.alert(
                "Antes de conversar",
                "Tu audio, parte de la conversación y los recuerdos necesarios se enviarán a nuestro servicio de IA para generar la respuesta. Los textos y recuerdos se guardarán en este dispositivo. Puedes borrar todo desde Configuración.",
                [
                    { text: "Ahora no", style: "cancel" },
                    {
                        text: "Aceptar y continuar",
                        onPress: async () => {
                            try {
                                await setVoiceConsent(true);
                                await startRecording();
                            } catch (error) {
                                Alert.alert("Error", error.message);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    }, [phase, startRecording]);

    const stopSpeaking = useCallback(async () => {
        await Speech.stop();
        if (mountedRef.current) setPhase("idle");
    }, []);

    const end = useCallback(async () => {
        if (busyRef.current || !recordingRef.current) return;
        busyRef.current = true;
        clearTimeout(timerRef.current);
        let uri = null;

        try {
            // Concluimos la grabación antes de subirla.
            await recorder.stop();
            recordingRef.current = false;
            uri = recorder.uri;

            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            });
            if (mountedRef.current) setPhase("thinking");

            const context = await getConversationContext();
            const networkController = new AbortController();
            networkRef.current = networkController;
            const turn = await requestVoiceTurn({
                uri,
                user,
                companion,
                context,
                signal: networkController.signal,
            });
            networkRef.current = null;

            if (!turn.transcript || !turn.reply) {
                throw new Error("No te escuché bien. Intenta otra vez.");
            }

            await saveConversation(turn);

            if (!mountedRef.current) return;

            setLastReply(turn.reply);
            setError(null);
            setPhase("speaking");

            Speech.speak(turn.reply, {
                language: user.language === "en" ? "en-US" : "es-PE",
                rate: 0.96,
                onDone: () => {
                    if (mountedRef.current) setPhase("idle");
                },
                onStopped: () => {
                    if (mountedRef.current) setPhase("idle");
                },
                onError: () => {
                    if (mountedRef.current) {
                        setPhase("idle");
                        Alert.alert("Voz", "No se pudo reproducir la respuesta.");
                    }
                },
            });
        } catch (reason) {
            if (mountedRef.current) {
                setPhase("idle");
                setError(reason.message);
                Alert.alert("No pudimos conversar", reason.message);
            }
        } finally {
            networkRef.current = null;
            deleteTemporaryRecording(uri);
            busyRef.current = false;
        }
    }, [recorder, user, companion]);

    endRef.current = end;

    const action = useCallback(() => {
        if (phase === "listening") return end();
        if (phase === "speaking") return stopSpeaking();
        if (phase === "idle") return begin();
    }, [phase, begin, end, stopSpeaking]);

    return {
        phase,
        error,
        lastReply,
        isRecording: recordingState.isRecording,
        action,
        busy: phase === "thinking",
    };
}
