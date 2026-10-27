import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Alert, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Settings2, Mic, Square } from "lucide-react-native";
import { Blobatar } from "@blobatar/react-native";

import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";

import * as SQLite from "expo-sqlite";

import Screen from "../components/ui/Screen";
import TextApp from "../components/ui/TextApp";
import Button from "../components/ui/Button";
import { tokens } from "../styles/tokens";

const COLORS = tokens.colors;

export default function Home() {
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [friend, setFriend] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [recordingCompleted, setRecordingCompleted] = useState(false);

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(recorder);

    const isListening = recorderState.isRecording;

    const pulse = useRef(new Animated.Value(1)).current;
    const recordingRef = useRef(false);

    const avatarSize = Math.min(width - 80, 300);

    // Cargar compañero desde SQLite
    useEffect(() => {
        let active = true;

        async function loadFriend() {
            try {
                const db = await SQLite.openDatabaseAsync("cerca.db");

                const companion = await db.getFirstAsync(
                    "SELECT * FROM companion_profile WHERE id = 1"
                );

                if (!active) return;

                if (!companion) {
                    router.replace("/onboarding");
                    return;
                }

                setFriend({
                    name: companion.name,
                    gender: companion.gender,
                });
            } catch (error) {
                console.error("Error cargando compañero:", error);

                if (active) {
                    Alert.alert(
                        "Error",
                        "No pudimos cargar tu compañero."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadFriend();

        return () => {
            active = false;

            if (recordingRef.current) {
                recorder.stop().catch(console.error);
                recordingRef.current = false;
            }
        };
    }, [router, recorder]);

    // Animación suave del avatar
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: isListening ? 1.065 : 1.025,
                    duration: isListening ? 600 : 1800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: isListening ? 600 : 1800,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [isListening, pulse]);

    const startListening = async () => {
        if (busy) return;

        try {
            setBusy(true);

            const permission =
                await AudioModule.requestRecordingPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Permiso necesario",
                    "Permite el uso del micrófono para hablar con CERCA."
                );
                return;
            }

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            await recorder.prepareToRecordAsync();
            await recorder.record();

            recordingRef.current = true;
            setRecordingCompleted(false);

        } catch (error) {
            console.error("Error de grabación:", error);

            Alert.alert(
                "Micrófono no disponible",
                "No pudimos comenzar la grabación."
            );
        } finally {
            setBusy(false);
        }
    };

    const stopListening = async () => {
        if (busy) return;

        try {
            setBusy(true);

            await recorder.stop();

            recordingRef.current = false;
            setRecordingCompleted(true);

            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            });

        } catch (error) {
            console.error("Error deteniendo grabación:", error);

            Alert.alert(
                "Error",
                "No pudimos detener la grabación."
            );
        } finally {
            setBusy(false);
        }
    };

    if (loading || !friend) {
        return (
            <Screen>
                <View style={styles.loading}>
                    <TextApp color="muted">
                        Un momento...
                    </TextApp>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.container}>

                {/* Encabezado minimalista */}
                <View style={styles.header}>
                    <TextApp size="xl" weight="bold">
                        cerca.
                    </TextApp>

                    <Button
                        variant="ghost"
                        icon={<Settings2 size={24} />}
                        iconOnly
                        accessibilityLabel="Configuración"
                        onPress={() => router.push("/settings")}
                    />
                </View>

                {/* Compañero */}
                <View style={styles.companion}>
                    <Animated.View
                        style={[
                            styles.avatar,
                            {
                                width: avatarSize,
                                height: avatarSize,
                                transform: [{ scale: pulse }],
                            },
                        ]}
                    >
                        <Blobatar
                            name={friend.name}
                            size={avatarSize}
                        />
                    </Animated.View>

                    <TextApp
                        size="4xl"
                        weight="semibold"
                        align="center"
                    >
                        {friend.name}
                    </TextApp>

                    {isListening && (
                        <View style={styles.status}>
                            <View style={styles.statusDot} />

                            <TextApp
                                size="md"
                                color="muted"
                            >
                                Grabando tu voz...
                            </TextApp>
                        </View>
                    )}
                </View>

                {/* Control principal */}
                <View style={styles.controls}>
                    <Button
                        variant={
                            isListening
                                ? "destructive"
                                : "primary"
                        }
                        rounded="full"
                        size="lg"
                        icon={
                            isListening
                                ? <Square size={27} fill={COLORS.white} />
                                : <Mic size={32} />
                        }
                        iconOnly
                        style={styles.micButton}
                        disabled={busy}
                        accessibilityLabel={
                            isListening
                                ? "Detener grabación"
                                : "Empezar a grabar"
                        }
                        onPress={
                            isListening
                                ? stopListening
                                : startListening
                        }
                    />

                    <TextApp
                        size="md"
                        color="muted"
                        align="center"
                    >
                        {isListening
                            ? "Toca para terminar"
                            : recordingCompleted
                                ? "Grabación finalizada"
                                : "Toca para hablar"}
                    </TextApp>
                </View>

            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 500,
        justifyContent: "space-between",
        paddingBottom: 32,
    },

    loading: {
        flex: 1,
        minHeight: 400,
        alignItems: "center",
        justifyContent: "center",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    companion: {
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        paddingVertical: 36,
    },

    avatar: {
        alignItems: "center",
        justifyContent: "center",
    },

    status: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.red,
    },

    controls: {
        alignItems: "center",
        gap: 16,
    },

    micButton: {
        width: 84,
        height: 84,
        borderRadius: 42,
        elevation: 4,
    },
});