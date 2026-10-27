import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Input from "../../components/ui/Input";
import Screen from "../../components/ui/Screen";
import TextApp from "../../components/ui/TextApp";
import { GENDERS, INTERESTS, languageApp } from "../../constants/app";
import { tokens } from "../../styles/tokens";

const COLORS = tokens.colors;

export default function Onboarding() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState(null);
    const [language, setLanguage] = useState("es");
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(false);

    const toggleInterest = (interest) => setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);

    const handleContinue = async () => {
        const parsedAge = Number(age);

        if (!name.trim()) {
            return Alert.alert(
                "Falta tu nombre",
                "Cuéntanos cómo te gustaría que te llamemos."
            );
        }

        if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 120) {
            return Alert.alert(
                "Revisa tu edad",
                "Por ahora CERCA está disponible para mayores de 18 años."
            );
        }

        if (!gender) {
            return Alert.alert(
                "Una pregunta más",
                "Selecciona una de las opciones de género."
            );
        }

        if (interests.length === 0) {
            return Alert.alert(
                "Tus intereses",
                "Selecciona al menos un tema que te guste."
            );
        }

        try {
            setLoading(true);

            const db = await SQLite.openDatabaseAsync("cerca.db");

            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS user_profile (
                    id INTEGER PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL,
                    gender TEXT NOT NULL,
                    language TEXT NOT NULL,
                    interests TEXT NOT NULL
                );
            `);

            await db.runAsync(
                `INSERT OR REPLACE INTO user_profile
                (id, name, age, gender, language, interests)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    1,
                    name.trim(),
                    parsedAge,
                    gender,
                    language,
                    JSON.stringify(interests),
                ]
            );

            router.push("/choose-friend");
        } catch (error) {
            console.error("Error guardando perfil:", error);
            Alert.alert(
                "Algo salió mal",
                "No pudimos guardar tus datos. Intenta nuevamente."
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
                    <Button variant="secondary" size="md" icon={<ArrowLeft size={22} color={COLORS.black}/>} iconOnly accessibilityLabel="Volver" onPress={() => router.back()}/>
                    <TextApp size="sm" color="muted">PASO 01 DE 02</TextApp>
                </View>

                {/* Progreso */}
                <View style={styles.progress}>
                    <View style={styles.progressActive} />
                    <View style={styles.progressInactive} />
                </View>

                {/* Introducción */}
                <View style={styles.intro}>
                    <TextApp size="6xl" weight="bold" style={styles.title}>Primero,</TextApp>
                    <TextApp size="6xl" weight="bold" style={styles.titleGreen}>hablemos de ti.</TextApp>
                    <TextApp size="lg" color="muted" style={styles.description}>
                        Toda amistad comienza conociéndose.
                        Cuéntanos un poquito sobre ti.
                    </TextApp>
                </View>

                {/* Formulario */}
                <View style={styles.form}>

                    <View style={styles.field}>
                        <Input label="¿Cómo te llamamos?" placeholder="Tu nombre o apodo" value={name} onChangeText={setName} maxLength={40} autoCapitalize="words"/>
                    </View>

                    <View style={styles.field}>
                        <Input label="¿Cuántos años tienes?" placeholder="Tu edad" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} />
                    </View>

                    <View style={styles.field}>
                        <TextApp weight="semibold" size="lg">¿Cómo te identificas?</TextApp>
                        <View style={styles.options}>
                            {GENDERS.map((option) => (
                                <Chip key={option.value} label={option.label} selected={gender === option.value} onPress={() => setGender(option.value)} />
                            ))}
                        </View>
                    </View>

                    <View style={styles.field}>
                        <TextApp weight="semibold" size="lg">¿En qué idioma conversamos?</TextApp>
                        <View style={styles.options}>
                            {languageApp.map((option) => (
                                <Chip key={option.value} label={option.label} selected={language === option.value} onPress={() => setLanguage(option.value)} />
                            ))}
                        </View>
                    </View>

                    <View style={styles.field}>
                        <TextApp weight="semibold" size="lg">¿Qué cosas te gustan?</TextApp>
                        <TextApp size="md" color="muted">Elige algunas. Tu amigo también tendrá sus propios gustos.</TextApp>
                        <View style={styles.options}>
                            {INTERESTS.map((interest) => (
                                <Chip key={interest} label={interest} selected={interests.includes(interest)} onPress={() => toggleInterest(interest)} />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Continuar */}
                <View style={styles.footer}>
                    <Button label={loading ? "Guardando..." : "Continuar"} size="lg" disabled={loading} onPress={handleContinue}/>
                    <TextApp size="sm" color="muted" align="center">Tus datos personales se guardan en este dispositivo.</TextApp>
                </View>

            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 26,
        paddingBottom: 20,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.light,
        justifyContent: "center",
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

    progressInactive: {
        flex: 1,
        height: 5,
        borderRadius: 10,
        backgroundColor: COLORS.border,
    },

    intro: {
        gap: 5,
    },

    title: {
        fontSize: 38,
        lineHeight: 44,
        letterSpacing: -1.5,
    },

    titleGreen: {
        fontSize: 38,
        lineHeight: 44,
        letterSpacing: -1.5,
        color: "#049135",
    },

    description: {
        lineHeight: 24,
        marginTop: 12,
    },

    form: {
        gap: 26,
    },

    field: {
        gap: 12,
    },

    input: {
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        paddingHorizontal: 18,
        fontFamily: "Outfit-Regular",
        fontSize: 16,
        color: COLORS.text,
    },

    options: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 9,
    },

    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: COLORS.white,
    },

    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },

    footer: {
        marginTop: 10,
        gap: 14,
    },
});