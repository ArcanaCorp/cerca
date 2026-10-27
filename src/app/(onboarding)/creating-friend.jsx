
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
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

const COLORS = tokens.colors;

const NAMES = {
    male: [
        "Leo",
        "Nico",
        "Mateo",
        "Lucas",
        "Bruno",
        "Gael",
        "Dante",
        "Thiago",
    ],
    female: [
        "Luna",
        "Mía",
        "Alma",
        "Vera",
        "Emma",
        "Clara",
        "Sofía",
        "Nina",
    ],
};

const OWN_INTERESTS = [
    "Fotografía",
    "Astronomía",
    "Naturaleza",
    "Música",
    "Historia",
    "Cine",
    "Arte",
    "Viajes",
    "Cocina",
    "Lectura",
    "Animales",
    "Videojuegos",
    "Deportes",
    "Tecnología",
    "Filosofía",
];

const HUMOR_STYLES = [
    "Espontáneo",
    "Ingenioso",
    "Tranquilo",
    "Juguetón",
];

const pick = (array) =>
    array[Math.floor(Math.random() * array.length)];

const score = () =>
    Math.floor(Math.random() * 51) + 30;

function generateFriend(preference, userInterests) {
    const gender =
        preference === "random"
            ? pick(["male", "female"])
            : preference;

    const personality = {
        openness: score(),
        conscientiousness: score(),
        extraversion: score(),
        agreeableness: score(),
        neuroticism: score(),
    };

    const name = pick(NAMES[gender]);

    // Un interés compartido es posible, pero no obligatorio.
    const sharedInterest =
        userInterests.length > 0 && Math.random() > 0.35
            ? pick(userInterests)
            : null;

    const independentInterests = [...OWN_INTERESTS]
        .filter((interest) => interest !== sharedInterest)
        .sort(() => Math.random() - 0.5)
        .slice(0, sharedInterest ? 2 : 3);

    const interests = sharedInterest
        ? [sharedInterest, ...independentInterests]
        : independentInterests;

    const communicationStyle =
        personality.extraversion >= 60
            ? "Expresivo y conversador"
            : "Tranquilo y observador";

    return {
        name,
        gender,
        personality,
        interests,
        humor: pick(HUMOR_STYLES),
        communicationStyle,
    };
}

export default function CreatingFriend() {
    const router = useRouter();

    const [status, setStatus] = useState("creating");
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

    // Crear y guardar la identidad una sola vez.
    useEffect(() => {
        let active = true;

        async function prepareFriend() {
            try {
                setStatus("creating");
                setErrorMessage("");

                const db = await SQLite.openDatabaseAsync("cerca.db");

                await db.execAsync(`
                    CREATE TABLE IF NOT EXISTS companion_profile (
                        id INTEGER PRIMARY KEY NOT NULL,
                        name TEXT NOT NULL,
                        gender TEXT NOT NULL,
                        personality TEXT NOT NULL,
                        interests TEXT NOT NULL,
                        humor TEXT NOT NULL,
                        communication_style TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    );
                `);

                // Si ya existe, conservamos su identidad.
                const existing = await db.getFirstAsync(
                    "SELECT * FROM companion_profile WHERE id = 1"
                );

                if (existing) {
                    if (!active) return;

                    setFriend({
                        name: existing.name,
                        gender: existing.gender,
                        personality: JSON.parse(existing.personality),
                        interests: JSON.parse(existing.interests),
                        humor: existing.humor,
                        communicationStyle: existing.communication_style,
                    });

                    setStatus("ready");
                    return;
                }

                const preference = await db.getFirstAsync(
                    "SELECT preference FROM companion_preferences WHERE id = 1"
                );

                const user = await db.getFirstAsync(
                    "SELECT interests FROM user_profile WHERE id = 1"
                );

                if (!preference || !user) {
                    throw new Error(
                        "Completa el onboarding antes de crear a tu amigo."
                    );
                }

                const userInterests = JSON.parse(user.interests);

                const generated = generateFriend(
                    preference.preference,
                    userInterests
                );

                await db.runAsync(
                    `INSERT OR IGNORE INTO companion_profile (
                        id,
                        name,
                        gender,
                        personality,
                        interests,
                        humor,
                        communication_style,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        1,
                        generated.name,
                        generated.gender,
                        JSON.stringify(generated.personality),
                        JSON.stringify(generated.interests),
                        generated.humor,
                        generated.communicationStyle,
                        new Date().toISOString(),
                    ]
                );

                // Leer siempre la identidad que realmente quedó guardada.
                const saved = await db.getFirstAsync(
                    "SELECT * FROM companion_profile WHERE id = 1"
                );

                if (!saved) {
                    throw new Error("No se pudo guardar la identidad.");
                }

                if (!active) return;

                setFriend({
                    name: saved.name,
                    gender: saved.gender,
                    personality: JSON.parse(saved.personality),
                    interests: JSON.parse(saved.interests),
                    humor: saved.humor,
                    communicationStyle: saved.communication_style,
                });

                setStatus("ready");
            } catch (error) {
                console.error("Error creando compañero:", error);

                if (!active) return;

                setErrorMessage(error.message);
                setStatus("error");
            }
        }

        prepareFriend();

        return () => {
            active = false;
        };
    }, [attempt]);

    const isReady = status === "ready";

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
                                : "Preparando tu conexión"}
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

                    {status === "creating" && (
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