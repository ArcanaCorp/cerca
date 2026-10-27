import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Heart, Shuffle, UserRound, UsersRound } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Screen from "../../components/ui/Screen";
import TextApp from "../../components/ui/TextApp";
import { tokens } from "../../styles/tokens";
import { useApp } from "../../hooks/useApp";

const COLORS = tokens.colors;

const FRIEND_OPTIONS = [
    {
        value: "male",
        label: "Un amigo",
        description: "Alguien con quien conversar, reír y compartir momentos.",
        icon: UserRound,
    },
    {
        value: "female",
        label: "Una amiga",
        description: "Alguien con quien crear una amistad a tu propio ritmo.",
        icon: UsersRound,
    },
    {
        value: "random",
        label: "Sorpréndeme",
        description: "Deja que CERCA decida a quién vas a conocer.",
        icon: Shuffle,
    },
];

export default function ChooseFriend() {
    const router = useRouter();
    const { chooseFriend, preference } = useApp();

    const [selected, setSelected] = useState(preference);
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!selected || loading) return;

        try {
            setLoading(true);

            await chooseFriend(selected);
            router.replace("/creating-friend");

        } catch (error) {
            console.error("Error guardando preferencia:", error);

            Alert.alert(
                "Algo salió mal",
                "No pudimos guardar tu elección. Intenta nuevamente."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <View style={styles.container}>

                {/* Navegación */}
                <View style={styles.header}>
                    <Button
                        variant="secondary"
                        icon={<ArrowLeft size={22} />}
                        iconOnly
                        accessibilityLabel="Volver"
                        onPress={() => router.back()}
                    />

                    <TextApp size="sm" color="muted" weight="medium">
                        PASO 02 DE 02
                    </TextApp>
                </View>

                {/* Progreso */}
                <View style={styles.progress}>
                    <View style={styles.progressActive} />
                    <View style={styles.progressActive} />
                </View>

                {/* Ilustración */}
                <View style={styles.hero}>
                    <View style={styles.orbitOuter}>
                        <View style={styles.orbitMiddle}>
                            <View style={styles.heartContainer}>
                                <Heart
                                    size={44}
                                    color={COLORS.black}
                                    fill={COLORS.primary}
                                    strokeWidth={1.7}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.heroTag}>
                        <TextApp size="sm" weight="medium">
                            Una nueva conexión
                        </TextApp>
                    </View>
                </View>

                {/* Introducción */}
                <View style={styles.intro}>
                    <TextApp
                        size="6xl"
                        weight="bold"
                        style={styles.title}
                    >
                        ¿A quién quieres
                    </TextApp>

                    <TextApp
                        size="6xl"
                        weight="bold"
                        style={styles.titleGreen}
                    >
                        conocer?
                    </TextApp>

                    <TextApp
                        size="lg"
                        color="muted"
                        style={styles.description}
                    >
                        Toda amistad empieza con un primer hola.
                        Tú decides con quién comenzar.
                    </TextApp>
                </View>

                {/* Opciones */}
                <View style={styles.options}>
                    {FRIEND_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selected === option.value;

                        return (
                            <View
                                key={option.value}
                                style={[
                                    styles.option,
                                    isSelected && styles.optionSelected,
                                ]}
                            >
                                <View style={styles.optionTop}>
                                    <View
                                        style={[
                                            styles.optionIcon,
                                            isSelected && styles.optionIconSelected,
                                        ]}
                                    >
                                        <Icon
                                            size={23}
                                            color={COLORS.black}
                                            strokeWidth={1.8}
                                        />
                                    </View>

                                    <Chip
                                        label={option.label}
                                        selected={isSelected}
                                        onPress={() => setSelected(option.value)}
                                    />
                                </View>

                                <TextApp
                                    size="md"
                                    color="muted"
                                    style={styles.optionDescription}
                                >
                                    {option.description}
                                </TextApp>
                            </View>
                        );
                    })}
                </View>

                {/* Mensaje */}
                <View style={styles.note}>
                    <Heart
                        size={17}
                        color={COLORS.green}
                        strokeWidth={2}
                    />

                    <View style={{ flex: 1 }}>
                        <TextApp size="md" color="muted">
                            Tu nuevo amigo tendrá su propia personalidad,
                            intereses e historia. Lo irás conociendo
                            poco a poco.
                        </TextApp>
                    </View>
                </View>

                {/* Acciones */}
                <View style={styles.footer}>
                    <Button
                        variant="primary"
                        label={loading ? "Preparando..." : "Conocer a mi amigo"}
                        icon={<ArrowRight size={20} />}
                        size="lg"
                        fullWidth
                        disabled={!selected || loading}
                        onPress={handleContinue}
                    />

                    <TextApp size="sm" color="muted" align="center">
                        Una amistad, a tu ritmo y sin presiones.
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

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    progress: {
        flexDirection: "row",
        gap: 6,
    },

    progressActive: {
        flex: 1,
        height: 5,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
    },

    hero: {
        height: 185,
        backgroundColor: "#161E19",
        borderRadius: tokens.radius["3xl"],
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    orbitOuter: {
        width: 155,
        height: 155,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: "rgba(80,247,137,0.20)",
        alignItems: "center",
        justifyContent: "center",
    },

    orbitMiddle: {
        width: 120,
        height: 120,
        borderRadius: 70,
        backgroundColor: "rgba(80,247,137,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },

    heartContainer: {
        width: 85,
        height: 85,
        borderRadius: 50,
        backgroundColor: "#304A39",
        alignItems: "center",
        justifyContent: "center",
    },

    heroTag: {
        position: "absolute",
        bottom: 12,
        right: 14,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: tokens.radius.full,
        backgroundColor: COLORS.primary,
    },

    intro: {
        gap: 5,
    },

    title: {
        fontSize: 36,
        lineHeight: 42,
        letterSpacing: -1.3,
    },

    titleGreen: {
        fontSize: 36,
        lineHeight: 42,
        letterSpacing: -1.3,
        color: COLORS.green,
    },

    description: {
        marginTop: 9,
        lineHeight: 25,
    },

    options: {
        gap: 12,
    },

    option: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: tokens.radius.xl,
        padding: 16,
        gap: 12,
    },

    optionSelected: {
        backgroundColor: "#F4FFF7",
        borderColor: COLORS.primary,
        borderWidth: 1.5,
    },

    optionTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.light,
        alignItems: "center",
        justifyContent: "center",
    },

    optionIconSelected: {
        backgroundColor: COLORS.primary,
    },

    optionDescription: {
        lineHeight: 21,
    },

    note: {
        flexDirection: "row",
        gap: 11,
        backgroundColor: COLORS.greenBg,
        padding: 16,
        borderRadius: tokens.radius.lg,
    },

    footer: {
        marginTop: "auto",
        gap: 15,
    },
});