import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ActivityIndicator, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Settings2, Mic, Square, VolumeX, Sparkles } from "lucide-react-native";
import { Blobatar } from "@blobatar/react-native";

import Screen from "../components/ui/Screen";
import TextApp from "../components/ui/TextApp";
import Button from "../components/ui/Button";
import { tokens } from "../styles/tokens";
import { useApp } from "../hooks/useApp";
import { useLiveConversation } from "../hooks/useLiveConversation";

const COLORS = tokens.colors;

const PHASE_TEXT = {
    idle: "Toca para conversar",
    connecting: "Conectando con CERCA...",
    listening: "Te escucho · habla con naturalidad",
    thinking: "Estoy pensando...",
    speaking: "Estoy contigo · puedes interrumpirme",
};

export default function Home() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { companion: friend } = useApp();

    const { phase, action, busy, mode } = useLiveConversation();
    const pulse = useRef(new Animated.Value(1)).current;
    const avatarSize = Math.min(width - 70, 310);

    useEffect(() => {
        const active = phase !== "idle";
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: active ? 1.075 : 1.025,
                    duration: active ? 650 : 1700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: active ? 650 : 1700,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [phase, pulse]);

    if (!friend) {
        return (
            <Screen>
                <View style={styles.loading}>
                    <TextApp color="muted">Un momento...</TextApp>
                </View>
            </Screen>
        );
    }

    const listening = phase === "listening";
    const speaking = phase === "speaking";

    return (
        <Screen>
            <View style={styles.container}>

                <View style={styles.header}>
                    <TextApp size="xl" weight="bold">cerca.</TextApp>

                    <Button
                        variant="ghost"
                        icon={<Settings2 size={24} />}
                        iconOnly
                        accessibilityLabel="Configuración"
                        onPress={() => router.push("/settings")}
                    />
                </View>

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
                        <Blobatar name={friend.name} size={avatarSize} />
                    </Animated.View>

                    <TextApp size="4xl" weight="semibold" align="center">
                        {friend.name}
                    </TextApp>
                </View>

                <View style={styles.controls}>
                    <Button
                        variant={listening ? "destructive" : "primary"}
                        rounded="full"
                        size="lg"
                        icon={
                            busy
                                ? <ActivityIndicator color={COLORS.black} />
                                : listening
                                    ? <Square size={27} fill={COLORS.white} />
                                    : speaking
                                        ? <VolumeX size={30} />
                                        : phase === "thinking"
                                            ? <Sparkles size={30} />
                                            : <Mic size={32} />
                        }
                        iconOnly
                        style={styles.micButton}
                        disabled={busy}
                        accessibilityLabel={
                            listening
                                ? (mode === "legacy" ? "Enviar mi voz" : "Finalizar conversación")
                                : speaking
                                    ? "Detener respuesta"
                                    : "Hablar con mi amigo"
                        }
                        onPress={action}
                    />

                    <TextApp size="md" color="muted" align="center">
                        {mode === "legacy" && phase === "listening"
                            ? "Grabando · toca para enviar"
                            : PHASE_TEXT[phase]}
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
        paddingVertical: 28,
    },

    avatar: {
        alignItems: "center",
        justifyContent: "center",
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
