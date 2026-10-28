
import { useRouter } from "expo-router";
import {
    ArrowRight,
    Check,
    Heart,
    RefreshCw,
    Sparkles,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    View
} from "react-native";

import Button from "../../components/ui/Button";
import Screen from "../../components/ui/Screen";
import TextApp from "../../components/ui/TextApp";
import { tokens } from "../../styles/tokens";
import { useApp } from "../../hooks/useApp";
import { getCompanionConsent, setCompanionConsent } from "../../services/profile.service";

const COLORS = tokens.colors;

export default function CreatingFriend() {
    const router = useRouter();
    const { createCompanion } = useApp();

    const [status, setStatus] = useState("checking");
    const [friend, setFriend] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [attempt, setAttempt] = useState(0);

    const pulse = useRef(new Animated.Value(1)).current;

    // Animación de respiración del avatar.
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.09,
                    duration: 1300,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 1300,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [pulse]);

    // Recupera la misma identidad al regresar o reiniciar la aplicación.
    useEffect(() => {
        let active = true;
        async function prepareFriend() {
            try {
                setStatus("checking");
                setErrorMessage("");
                const consent = await getCompanionConsent();
                if (!active) return;
                if (!consent) {
                    setStatus("permission");
                    return;
                }
                setStatus("creating");
                const saved = await createCompanion();
                if (!active) return;
                setFriend(saved);
                setStatus("ready");
            } catch (error) {
                console.error("Error creando compañero:", error);
                if (!active) return;
                setErrorMessage(error.message);
                setStatus("error");
            }
        }
        prepareFriend();
        return () => { active = false; };
    }, [attempt, createCompanion]);

    const isReady = status === "ready";
    const grantPermission = async () => {
        try {
            await setCompanionConsent(true);
            setAttempt(value => value + 1);
        } catch (error) {
            setErrorMessage("No pudimos guardar tu autorización.");
            setStatus("error");
        }
    };

    return (
        <Screen>
            <View style={styles.container}>

                {/* Encabezado */}
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
                        {isReady ? (
                            <Check size={14} color={COLORS.green} />
                        ) : (
                            <Sparkles
                                size={14}
                                color={COLORS.green}
                            />
                        )}

                        <TextApp size="sm" weight="medium">
                            {isReady ? "Todo listo" : "Nueva amistad"}
                        </TextApp>
                    </View>
                </View>

                {/* Avatar animado */}
                <View style={styles.hero}>
                    <View style={styles.outerOrbit}>
                        <View style={styles.middleOrbit}>
                            <Animated.View
                                style={[
                                    styles.avatar,
                                    {
                                        transform: [
                                            { scale: pulse },
                                        ],
                                    },
                                ]}
                            >
                                <Heart
                                    size={65}
                                    color={COLORS.black}
                                    fill={COLORS.primary}
                                    strokeWidth={1.5}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    <View style={styles.heroLabel}>
                        <View style={styles.dot} />

                        <TextApp size="sm" weight="medium">
                            {isReady
                                ? "Listo para conocerte"
                                : status === "permission" ? "Tu decisión importa" : "Preparando tu conexión"}
                        </TextApp>
                    </View>
                </View>

                {/* Mensaje principal */}
                <View style={styles.intro}>
                    <TextApp
                        size="6xl"
                        weight="bold"
                        style={styles.title}
                    >
                        {isReady ? "Te presento a" : "Una amistad"}
                    </TextApp>

                    <TextApp
                        size="6xl"
                        weight="bold"
                        style={styles.titleGreen}
                    >
                        {isReady ? `${friend.name}.` : "está naciendo."}
                    </TextApp>

                    <TextApp
                        size="lg"
                        color="muted"
                        style={styles.description}
                    >
                        {isReady
                            ? "Tiene su propia personalidad, sus gustos y muchas cosas por descubrir contigo."
                            : "Estamos preparando a alguien especial, con su propia forma de ser."}
                    </TextApp>
                </View>

                {/* Identidad creada */}
                {isReady && (
                    <View style={styles.identityCard}>
                        <View style={styles.identityHeader}>
                            <Sparkles
                                size={19}
                                color={COLORS.green}
                            />

                            <TextApp
                                size="lg"
                                weight="semibold"
                            >
                                Un poquito sobre {friend.name}
                            </TextApp>
                        </View>

                        <View style={styles.identityRow}>
                            <TextApp color="muted">
                                Cómo es
                            </TextApp>

                            <TextApp weight="medium">
                                {friend.communicationStyle}
                            </TextApp>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.identityRow}>
                            <TextApp color="muted">
                                Su humor
                            </TextApp>

                            <TextApp weight="medium">
                                {friend.humor}
                            </TextApp>
                        </View>

                        <View style={styles.divider} />

                        <TextApp color="muted">
                            Algunas cosas que le gustan
                        </TextApp>

                        <View style={styles.interests}>
                            {friend.interests.map((interest) => (
                                <View
                                    key={interest}
                                    style={styles.interest}
                                >
                                    <TextApp
                                        size="sm"
                                        weight="medium"
                                    >
                                        {interest}
                                    </TextApp>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Error */}
                {status === "error" && (
                    <View style={styles.errorCard}>
                        <TextApp color="red" weight="medium">
                            No pudimos completar la creación.
                        </TextApp>

                        <TextApp color="muted">
                            {errorMessage}
                        </TextApp>
                    </View>
                )}

                {/* Acción */}
                <View style={styles.footer}>
                    {isReady && (
                        <Button
                            variant="primary"
                            label={`Conocer a ${friend.name}`}
                            icon={<ArrowRight size={20} />}
                            size="lg"
                            fullWidth
                            onPress={() =>
                                router.replace("/first-meeting")
                            }
                        />
                    )}

                    {status === "permission" && (
                        <View style={styles.errorCard}>
                            <TextApp size="lg" weight="semibold">
                                Crear una amistad con IA
                            </TextApp>
                            <TextApp color="muted">
                                Para inventar una identidad única, enviaremos tu nombre,
                                idioma e intereses a nuestro servicio de IA. El resultado
                                se guardará localmente. Si prefieres no compartir esos
                                datos, puedes regresar sin crear al compañero.
                            </TextApp>
                            <Button
                                variant="primary"
                                label="Autorizar y crear mi amigo"
                                size="lg"
                                fullWidth
                                onPress={grantPermission}
                            />
                            <Button
                                variant="ghost"
                                label="Ahora no"
                                fullWidth
                                onPress={() => router.replace("/choose-friend")}
                            />
                        </View>
                    )}

                    {status === "error" && (
                        <>
                            <Button
                                variant="secondary"
                                label="Reintentar"
                                icon={<RefreshCw size={19} />}
                                size="lg"
                                fullWidth
                                onPress={() =>
                                    setAttempt((value) => value + 1)
                                }
                            />

                            <Button
                                variant="ghost"
                                label="Volver al inicio"
                                onPress={() =>
                                    router.replace("/onboarding")
                                }
                            />
                        </>
                    )}

                    {(status === "creating" || status === "checking") && (
                        <TextApp
                            color="muted"
                            align="center"
                        >
                            Un momento...
                        </TextApp>
                    )}

                    {isReady && (
                        <TextApp
                            size="sm"
                            color="muted"
                            align="center"
                        >
                            No tienes que contarle todo hoy.
                            Tienen tiempo para conocerse.
                        </TextApp>
                    )}
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        gap: 26,
        paddingBottom: 20,
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: tokens.radius.full,
        backgroundColor: COLORS.greenBg,
    },

    hero: {
        height: 275,
        backgroundColor: "#161E19",
        borderRadius: tokens.radius["3xl"],
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    outerOrbit: {
        width: 225,
        height: 225,
        borderRadius: 120,
        borderWidth: 1,
        borderColor: "rgba(80,247,137,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },

    middleOrbit: {
        width: 180,
        height: 180,
        borderRadius: 100,
        backgroundColor: "rgba(80,247,137,0.08)",
        borderWidth: 1,
        borderColor: "rgba(80,247,137,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },

    avatar: {
        width: 130,
        height: 130,
        borderRadius: 70,
        backgroundColor: "#304A39",
        alignItems: "center",
        justifyContent: "center",
    },

    heroLabel: {
        position: "absolute",
        bottom: 17,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: tokens.radius.full,
        backgroundColor: COLORS.primary,
    },

    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.green,
    },

    intro: {
        gap: 6,
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

    identityCard: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: tokens.radius.xl,
        padding: 20,
        gap: 16,
    },

    identityHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    identityRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },

    interests: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    interest: {
        backgroundColor: COLORS.greenBg,
        borderRadius: tokens.radius.full,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    errorCard: {
        backgroundColor: COLORS.redBg,
        padding: 16,
        borderRadius: tokens.radius.lg,
        gap: 6,
    },

    footer: {
        marginTop: "auto",
        gap: 15,
    },
});