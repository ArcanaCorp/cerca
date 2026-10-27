
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
    ArrowRight,
    Heart,
    Sparkles,
    Volume2,
    VolumeX
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    StyleSheet,
    View,
} from "react-native";

import Button from "../../components/ui/Button";
import Screen from "../../components/ui/Screen";
import TextApp from "../../components/ui/TextApp";
import { tokens } from "../../styles/tokens";
import { useApp } from "../../hooks/useApp";

const COLORS = tokens.colors;

export default function FirstMeeting() {
    const router = useRouter();

    const { companion: friend, user, completeFirstMeeting } = useApp();
    const [speaking, setSpeaking] = useState(false);
    const [continuing, setContinuing] = useState(false);

    const pulse = useRef(new Animated.Value(1)).current;
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
            Speech.stop();
        };
    }, []);

    useEffect(() => {
        if (!speaking) {
            pulse.stopAnimation();
            Animated.spring(pulse, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [speaking, pulse]);

    const isEnglish = user?.language === "en";

    const greeting = friend && user
        ? isEnglish
            ? `Hey ${user.name}! I'm ${friend.name}. It's nice to meet you. We can get to know each other little by little. So, how's your day going?`
            : `¡Hola, ${user.name}! Soy ${friend.name}. Qué gusto conocerte. Podemos ir conociéndonos poco a poco, sin apuros. Cuéntame, ¿cómo va tu día?`
        : "";

    const playGreeting = async () => {
        if (!greeting) return;

        try {
            await Speech.stop();

            if (!mounted.current) return;

            setSpeaking(true);

            Speech.speak(greeting, {
                language: isEnglish ? "en-US" : "es-PE",
                rate: 0.92,
                pitch: 1,
                onDone: () => {
                    if (mounted.current) setSpeaking(false);
                },
                onStopped: () => {
                    if (mounted.current) setSpeaking(false);
                },
                onError: (error) => {
                    console.error("Error de voz:", error);

                    if (mounted.current) {
                        setSpeaking(false);
                        Alert.alert(
                            "Audio no disponible",
                            "No se pudo reproducir el saludo en este dispositivo."
                        );
                    }
                },
            });
        } catch (error) {
            console.error(error);
            setSpeaking(false);
        }
    };

    const stopGreeting = async () => {
        await Speech.stop();
        if (mounted.current) setSpeaking(false);
    };

    const handleContinue = async () => {
        if (!friend || continuing) return;

        try {
            setContinuing(true);

            await Speech.stop();

            await completeFirstMeeting();
            router.replace("/home");
        } catch (error) {
            console.error("Error finalizando presentación:", error);
            Alert.alert(
                "Algo salió mal",
                "No pudimos guardar tu progreso."
            );
        } finally {
            if (mounted.current) setContinuing(false);
        }
    };

    if (!friend || !user) {
        return (
            <Screen>
                <View style={styles.loading}>
                    <TextApp color="muted">
                        Preparando su primer encuentro...
                    </TextApp>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.container}>

                {/* Marca */}
                <View style={styles.header}>
                    <View style={styles.brand}>
                        <View style={styles.brandIcon}>
                            <Heart
                                size={16}
                                color={COLORS.black}
                                fill={COLORS.black}
                            />
                        </View>

                        <TextApp size="xl" weight="bold">
                            cerca.
                        </TextApp>
                    </View>

                    <View style={styles.badge}>
                        <Sparkles
                            size={14}
                            color={COLORS.green}
                        />
                        <TextApp size="sm" weight="medium">
                            Primer encuentro
                        </TextApp>
                    </View>
                </View>

                {/* Avatar */}
                <View style={styles.hero}>
                    <View style={styles.orbitOuter}>
                        <View style={styles.orbitMiddle}>
                            <Animated.View
                                style={[
                                    styles.avatar,
                                    {
                                        transform: [{ scale: pulse }],
                                    },
                                ]}
                            >
                                <Heart
                                    size={66}
                                    color={COLORS.black}
                                    fill={COLORS.primary}
                                    strokeWidth={1.5}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    <View style={styles.speechIndicator}>
                        <View
                            style={[
                                styles.indicatorDot,
                                speaking && styles.indicatorActive,
                            ]}
                        />

                        <TextApp size="sm" weight="medium">
                            {speaking
                                ? `${friend.name} está hablando`
                                : `${friend.name} está aquí`}
                        </TextApp>
                    </View>
                </View>

                {/* Presentación */}
                <View style={styles.intro}>
                    <TextApp
                        size="6xl"
                        weight="bold"
                        style={styles.title}
                    >
                        {friend.name} quiere
                    </TextApp>

                    <TextApp
                        size="6xl"
                        weight="bold"
                        style={styles.titleGreen}
                    >
                        saludarte.
                    </TextApp>

                    <TextApp
                        size="lg"
                        color="muted"
                        style={styles.description}
                    >
                        Ya se conocen por nombre. Ahora es momento
                        de escuchar su primer hola.
                    </TextApp>
                </View>

                {/* Saludo */}
                <View style={styles.greetingCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.smallAvatar}>
                            <Heart
                                size={19}
                                color={COLORS.black}
                                fill={COLORS.primary}
                            />
                        </View>

                        <View style={styles.cardIdentity}>
                            <TextApp weight="semibold" size="lg">
                                {friend.name}
                            </TextApp>

                            <TextApp size="sm" color="muted">
                                Tu compañero de IA
                            </TextApp>
                        </View>

                        <View style={styles.onlineDot} />
                    </View>

                    <TextApp
                        size="lg"
                        style={styles.greetingText}
                    >
                        “{greeting}”
                    </TextApp>

                    <Button
                        variant={speaking ? "secondary" : "primary"}
                        label={speaking ? "Detener saludo" : "Escuchar saludo"}
                        icon={
                            speaking
                                ? <VolumeX size={19} />
                                : <Volume2 size={19} />
                        }
                        iconPosition="left"
                        size="lg"
                        fullWidth
                        onPress={
                            speaking ? stopGreeting : playGreeting
                        }
                    />
                </View>

                {/* Mensaje */}
                <View style={styles.note}>
                    <Sparkles size={18} color={COLORS.green} />

                    <View style={{ flex: 1 }}>
                        <TextApp size="md" color="muted">
                            No necesitan tener todo en común.
                            Una buena amistad también se construye
                            descubriendo sus diferencias.
                        </TextApp>
                    </View>
                </View>

                {/* Acciones */}
                <View style={styles.footer}>
                    <Button
                        variant="primary"
                        label={
                            continuing
                                ? "Preparando..."
                                : "Ir a nuestra conversación"
                        }
                        icon={<ArrowRight size={20} />}
                        size="lg"
                        fullWidth
                        disabled={continuing}
                        onPress={handleContinue}
                    />

                    <TextApp
                        size="sm"
                        color="muted"
                        align="center"
                    >
                        Pueden empezar cuando tú quieras.
                    </TextApp>
                </View>

            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        gap: 24,
        paddingBottom: 20,
    },

    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 500,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    brand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
    },

    brandIcon: {
        width: 32,
        height: 32,
        borderRadius: 11,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: COLORS.greenBg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: tokens.radius.full,
    },

    hero: {
        height: 255,
        borderRadius: tokens.radius["3xl"],
        backgroundColor: "#161E19",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    orbitOuter: {
        width: 205,
        height: 205,
        borderRadius: 110,
        borderWidth: 1,
        borderColor: "rgba(80,247,137,0.18)",
        alignItems: "center",
        justifyContent: "center",
    },

    orbitMiddle: {
        width: 165,
        height: 165,
        borderRadius: 90,
        backgroundColor: "rgba(80,247,137,0.07)",
        borderWidth: 1,
        borderColor: "rgba(80,247,137,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },

    avatar: {
        width: 125,
        height: 125,
        borderRadius: 70,
        backgroundColor: "#304A39",
        alignItems: "center",
        justifyContent: "center",
    },

    speechIndicator: {
        position: "absolute",
        bottom: 15,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: tokens.radius.full,
    },

    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.green,
    },

    indicatorActive: {
        backgroundColor: COLORS.black,
    },

    intro: {
        gap: 5,
    },

    title: {
        fontSize: 38,
        lineHeight: 44,
        letterSpacing: -1.4,
    },

    titleGreen: {
        fontSize: 38,
        lineHeight: 44,
        letterSpacing: -1.4,
        color: COLORS.green,
    },

    description: {
        marginTop: 10,
        lineHeight: 25,
    },

    greetingCard: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: tokens.radius.xl,
        padding: 20,
        gap: 20,
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    smallAvatar: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: COLORS.greenBg,
        alignItems: "center",
        justifyContent: "center",
    },

    cardIdentity: {
        flex: 1,
        gap: 2,
    },

    onlineDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: COLORS.green,
    },

    greetingText: {
        lineHeight: 27,
        color: COLORS.text,
    },

    note: {
        flexDirection: "row",
        gap: 12,
        padding: 16,
        backgroundColor: COLORS.greenBg,
        borderRadius: tokens.radius.lg,
    },

    footer: {
        marginTop: "auto",
        gap: 14,
    },
});