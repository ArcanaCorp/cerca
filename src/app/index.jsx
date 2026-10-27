import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Heart, Sparkles, LockKeyhole } from "lucide-react-native";

import Screen from "../components/ui/Screen";
import TextApp from "../components/ui/TextApp";
import Button from "../components/ui/Button";
import { tokens } from "../styles/tokens";

export default function Index() {
    const router = useRouter();

    return (
        <Screen>
            <View style={styles.container}>

                <View style={styles.header}>
                    <View style={styles.brand}>
                        <View style={styles.brandIcon}>
                            <Heart size={17} color={tokens.colors.black} fill={tokens.colors.black} />
                        </View>
                        <TextApp weight="bold" size="xl">Cerca.</TextApp>
                    </View>

                    <View style={styles.tag}>
                        <Sparkles size={13} color={tokens.colors.green} />
                        <TextApp size="sm" weight="medium">Algo diferente</TextApp>
                    </View>
                </View>

                {/* Experiencia visual */}
                <View style={styles.hero}>
                    <View style={styles.messageTop}>
                        <TextApp size="md" weight="medium" color="white">¡Hey! ¿Cómo estás?</TextApp>
                    </View>

                    <View style={styles.orbitOuter}>
                        <View style={styles.orbitMiddle}>
                            <View style={styles.orbitInner}>
                                <Heart size={66} color={tokens.colors.black} strokeWidth={1.7} fill={tokens.colors.primary}/>
                            </View>
                        </View>
                    </View>

                    <View style={styles.messageBottom}>
                        <TextApp size="md" weight="medium">Aquí estoy para ti.</TextApp>
                        <View style={styles.onlineDot} />
                    </View>
                </View>

                {/* Contenido */}
                <View style={styles.bottom}>
                    <View style={styles.headline}>
                        <TextApp size="6xl" weight="bold" style={styles.title}>Una amistad</TextApp>
                        <TextApp size="6xl" weight="bold" style={styles.title}>comienza <TextApp size="6xl" weight="bold" color="green">aquí.</TextApp></TextApp>
                    </View>
                    <TextApp size="lg" color="muted" style={styles.description}>Conoce a alguien que te escucha, te recuerda y está contigo en cada momento.</TextApp>
                    <View style={styles.actions}>
                        <Button label="Comenzar" variant="primary" size="lg" icon={<ArrowRight size={21} color={tokens.colors.black} />} onPress={() => router.push("/onboarding")}/>
                        <View style={styles.privacy}>
                            <LockKeyhole size={13} color={tokens.colors.muted} />
                            <TextApp size="sm" color="muted" align="center">Tus recuerdos se guardan en tu dispositivo</TextApp>
                        </View>
                    </View>
                </View>

            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: "space-between",
        gap: 28,
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
        backgroundColor: tokens.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    tag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: tokens.colors.greenBg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: tokens.radius.full,
    },

    hero: {
        height: 300,
        backgroundColor: "#161E19",
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
    },

    orbitOuter: {
        width: 236,
        height: 236,
        borderRadius: 118,
        borderWidth: 1,
        borderColor: "rgba(80,247,137,0.18)",
        alignItems: "center",
        justifyContent: "center",
    },

    orbitMiddle: {
        width: 187,
        height: 187,
        borderRadius: 100,
        backgroundColor: "rgba(80,247,137,0.08)",
        borderWidth: 1,
        borderColor: "rgba(80,247,137,0.22)",
        alignItems: "center",
        justifyContent: "center",
    },

    orbitInner: {
        width: 139,
        height: 139,
        borderRadius: 70,
        backgroundColor: "#263B2E",
        alignItems: "center",
        justifyContent: "center",
    },

    messageTop: {
        position: "absolute",
        top: 24,
        left: 20,
        backgroundColor: "#304A39",
        paddingHorizontal: 17,
        paddingVertical: 12,
        borderRadius: 17,
        zIndex: 2,
    },

    messageBottom: {
        position: "absolute",
        bottom: 24,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        backgroundColor: tokens.colors.primary,
        paddingHorizontal: 17,
        paddingVertical: 12,
        borderRadius: 17,
        zIndex: 2,
    },

    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#166534",
    },

    bottom: {
        gap: 18,
    },

    headline: {
        gap: 0,
    },

    title: {
        fontSize: 38,
        lineHeight: 43,
        letterSpacing: -1.5,
    },

    description: {
        lineHeight: 26,
        maxWidth: 350,
    },

    actions: {
        marginTop: 12,
        gap: 20,
    },

    privacy: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },
});