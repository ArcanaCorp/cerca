
import { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Alert,
    Linking,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    UserRound,
    Mic,
    ShieldCheck,
    Trash2,
    ExternalLink,
    Heart,
    Save,
} from "lucide-react-native";
import * as SQLite from "expo-sqlite";
import { AudioModule } from "expo-audio";

import Screen from "../components/ui/Screen";
import TextApp from "../components/ui/TextApp";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Chip from "../components/ui/Chip";
import { tokens } from "../styles/tokens";

const COLORS = tokens.colors;

const GENDERS = [
    { label: "Hombre", value: "male" },
    { label: "Mujer", value: "female" },
    { label: "Otro", value: "other" },
    { label: "Prefiero no decirlo", value: "unspecified" },
];

const LANGUAGES = [
    { label: "Español", value: "es" },
    { label: "English", value: "en" },
];

const INTERESTS = [
    "Tecnología",
    "Música",
    "Cine",
    "Videojuegos",
    "Arte",
    "Deportes",
    "Viajes",
    "Cocina",
    "Lectura",
    "Naturaleza",
    "Emprendimiento",
    "Conversar",
];

export default function Settings() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("unspecified");
    const [language, setLanguage] = useState("es");
    const [interests, setInterests] = useState([]);

    const [friendName, setFriendName] = useState("");
    const [micGranted, setMicGranted] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadSettings() {
            let db;

            try {
                db = await SQLite.openDatabaseAsync("cerca.db");

                const profile = await db.getFirstAsync(
                    "SELECT * FROM user_profile WHERE id = 1"
                );

                const companion = await db.getFirstAsync(
                    "SELECT name FROM companion_profile WHERE id = 1"
                );

                const permission =
                    await AudioModule.getRecordingPermissionsAsync();

                if (!active) return;

                if (!profile) {
                    router.replace("/onboarding");
                    return;
                }

                setName(profile.name);
                setAge(String(profile.age));
                setGender(profile.gender);
                setLanguage(profile.language);
                setInterests(JSON.parse(profile.interests || "[]"));

                setFriendName(companion?.name || "");
                setMicGranted(permission.granted);

            } catch (error) {
                console.error("Error cargando configuración:", error);

                if (active) {
                    Alert.alert(
                        "Error",
                        "No pudimos cargar la configuración."
                    );
                }
            } finally {
                if (db) await db.closeAsync();

                if (active) setLoading(false);
            }
        }

        loadSettings();

        return () => {
            active = false;
        };
    }, []);

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/home");
        }
    };

    const toggleInterest = (interest) => {
        setInterests((current) =>
            current.includes(interest)
                ? current.filter((item) => item !== interest)
                : [...current, interest]
        );
    };

    const saveProfile = async () => {
        if (saving) return;

        const cleanName = name.trim();
        const parsedAge = Number(age);

        if (!cleanName) {
            Alert.alert("Nombre requerido", "Ingresa tu nombre o apodo.");
            return;
        }

        if (
            !Number.isInteger(parsedAge) ||
            parsedAge < 18 ||
            parsedAge > 120
        ) {
            Alert.alert(
                "Edad no válida",
                "Ingresa una edad entre 18 y 120 años."
            );
            return;
        }

        if (interests.length === 0) {
            Alert.alert(
                "Tus intereses",
                "Selecciona al menos un interés."
            );
            return;
        }

        let db;

        try {
            setSaving(true);

            db = await SQLite.openDatabaseAsync("cerca.db");

            await db.runAsync(
                `UPDATE user_profile
                 SET name = ?,
                     age = ?,
                     gender = ?,
                     language = ?,
                     interests = ?
                 WHERE id = 1`,
                [
                    cleanName,
                    parsedAge,
                    gender,
                    language,
                    JSON.stringify(interests),
                ]
            );

            Alert.alert(
                "Perfil actualizado",
                "Tus cambios se guardaron correctamente."
            );
        } catch (error) {
            console.error("Error guardando perfil:", error);

            Alert.alert(
                "No pudimos guardar",
                "Intenta nuevamente."
            );
        } finally {
            if (db) await db.closeAsync();
            setSaving(false);
        }
    };

    const requestMicrophone = async () => {
        try {
            if (micGranted) {
                await Linking.openSettings();
                return;
            }

            const permission =
                await AudioModule.requestRecordingPermissionsAsync();

            setMicGranted(permission.granted);

            if (!permission.granted) {
                Alert.alert(
                    "Permiso no concedido",
                    "Puedes habilitar el micrófono desde los ajustes de tu teléfono.",
                    [
                        { text: "Cancelar", style: "cancel" },
                        {
                            text: "Abrir ajustes",
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
            }
        } catch (error) {
            console.error("Error solicitando micrófono:", error);

            Alert.alert(
                "Error",
                "No pudimos revisar los permisos del micrófono."
            );
        }
    };

    const deleteAllData = () => {
        Alert.alert(
            "¿Empezar de nuevo?",
            `Esto eliminará tu perfil, la identidad de ${friendName || "tu compañero"} y los datos de CERCA guardados actualmente en su base local. No podrás recuperarlos.`,
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Eliminar datos",
                    style: "destructive",
                    onPress: confirmDelete,
                },
            ]
        );
    };

    const confirmDelete = async () => {
        if (deleting) return;

        let db;

        try {
            setDeleting(true);

            db = await SQLite.openDatabaseAsync("cerca.db");

            // Borra los registros de las tablas actuales,
            // manteniendo la estructura de la base de datos.
            const tableNames = [
                "app_state",
                "companion_profile",
                "companion_preferences",
                "user_profile",
            ];

            await db.withExclusiveTransactionAsync(async (txn) => {
                const existingTables = await txn.getAllAsync(
                    `SELECT name
                     FROM sqlite_master
                     WHERE type = 'table'`
                );

                const existingNames = new Set(
                    existingTables.map((table) => table.name)
                );

                for (const table of tableNames) {
                    if (existingNames.has(table)) {
                        await txn.execAsync(`DELETE FROM "${table}"`);
                    }
                }
            });

            await db.closeAsync();
            db = null;

            router.replace("/");
        } catch (error) {
            console.error("Error eliminando datos:", error);

            Alert.alert(
                "No pudimos eliminar los datos",
                "Intenta nuevamente."
            );
        } finally {
            if (db) await db.closeAsync();
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Screen>
                <View style={styles.loading}>
                    <ActivityIndicator
                        size="large"
                        color={COLORS.green}
                    />
                    <TextApp color="muted">
                        Cargando configuración...
                    </TextApp>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.container}>

                {/* Encabezado */}
                <View style={styles.header}>
                    <Button
                        variant="secondary"
                        icon={<ArrowLeft size={22} />}
                        iconOnly
                        accessibilityLabel="Volver"
                        onPress={goBack}
                    />

                    <TextApp size="sm" weight="medium" color="muted">
                        CERCA
                    </TextApp>
                </View>

                {/* Título */}
                <View style={styles.intro}>
                    <TextApp
                        weight="bold"
                        size="6xl"
                        style={styles.title}
                    >
                        Tu espacio,
                    </TextApp>

                    <TextApp
                        weight="bold"
                        size="6xl"
                        style={styles.titleGreen}
                    >
                        tus reglas.
                    </TextApp>

                    <TextApp
                        color="muted"
                        size="lg"
                        style={styles.description}
                    >
                        Ajusta lo que necesites. Todo a tu ritmo.
                    </TextApp>
                </View>

                {/* Perfil */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <UserRound size={20} color={COLORS.black} />
                        </View>

                        <View>
                            <TextApp size="xl" weight="semibold">
                                Sobre ti
                            </TextApp>
                            <TextApp size="sm" color="muted">
                                Tu información personal
                            </TextApp>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Input
                            label="¿Cómo te llamamos?"
                            placeholder="Tu nombre o apodo"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            maxLength={40}
                        />

                        <Input
                            label="Tu edad"
                            placeholder="Tu edad"
                            value={age}
                            onChangeText={setAge}
                            keyboardType="number-pad"
                            maxLength={3}
                        />

                        <View style={styles.field}>
                            <TextApp size="lg" weight="semibold">
                                ¿Cómo te identificas?
                            </TextApp>

                            <View style={styles.chips}>
                                {GENDERS.map((option) => (
                                    <Chip
                                        key={option.value}
                                        label={option.label}
                                        selected={gender === option.value}
                                        onPress={() =>
                                            setGender(option.value)
                                        }
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.field}>
                            <TextApp size="lg" weight="semibold">
                                Idioma
                            </TextApp>

                            <View style={styles.chips}>
                                {LANGUAGES.map((option) => (
                                    <Chip
                                        key={option.value}
                                        label={option.label}
                                        selected={language === option.value}
                                        onPress={() =>
                                            setLanguage(option.value)
                                        }
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.field}>
                            <TextApp size="lg" weight="semibold">
                                Tus intereses
                            </TextApp>

                            <TextApp color="muted">
                                Puedes cambiarlos cuando quieras.
                            </TextApp>

                            <View style={styles.chips}>
                                {INTERESTS.map((interest) => (
                                    <Chip
                                        key={interest}
                                        label={interest}
                                        selected={interests.includes(interest)}
                                        onPress={() =>
                                            toggleInterest(interest)
                                        }
                                    />
                                ))}
                            </View>
                        </View>

                        <Button
                            variant="primary"
                            label={saving ? "Guardando..." : "Guardar cambios"}
                            icon={<Save size={19} />}
                            size="lg"
                            fullWidth
                            disabled={saving}
                            onPress={saveProfile}
                        />
                    </View>
                </View>

                {/* Permisos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <Mic size={20} color={COLORS.black} />
                        </View>

                        <View>
                            <TextApp size="xl" weight="semibold">
                                Permisos
                            </TextApp>

                            <TextApp size="sm" color="muted">
                                Tú decides cuándo CERCA puede escucharte
                            </TextApp>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.permissionRow}>
                            <View style={styles.permissionInfo}>
                                <TextApp weight="semibold" size="lg">
                                    Micrófono
                                </TextApp>

                                <TextApp size="sm" color="muted">
                                    {micGranted
                                        ? "Permiso concedido"
                                        : "Permiso pendiente"}
                                </TextApp>
                            </View>

                            <Button
                                variant="secondary"
                                label={
                                    micGranted
                                        ? "Ajustes"
                                        : "Permitir"
                                }
                                icon={
                                    micGranted
                                        ? <ExternalLink size={16} />
                                        : <Mic size={16} />
                                }
                                onPress={requestMicrophone}
                            />
                        </View>

                        <TextApp
                            size="sm"
                            color="muted"
                            style={styles.hint}
                        >
                            CERCA solo activa la grabación cuando
                            tú pulsas el micrófono.
                        </TextApp>
                    </View>
                </View>

                {/* Privacidad */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <ShieldCheck
                                size={20}
                                color={COLORS.black}
                            />
                        </View>

                        <View>
                            <TextApp size="xl" weight="semibold">
                                Privacidad
                            </TextApp>

                            <TextApp size="sm" color="muted">
                                Tu información, bajo tu control
                            </TextApp>
                        </View>
                    </View>

                    <View style={styles.privacyCard}>
                        <ShieldCheck
                            size={22}
                            color={COLORS.green}
                        />

                        <View style={styles.privacyContent}>
                            <TextApp weight="semibold" size="lg">
                                Datos guardados localmente
                            </TextApp>

                            <TextApp
                                size="md"
                                color="muted"
                                style={styles.privacyText}
                            >
                                Tu perfil y la identidad de tu compañero
                                se guardan en SQLite, dentro de este
                                dispositivo.
                            </TextApp>

                            <TextApp
                                size="sm"
                                color="muted"
                                style={styles.privacyText}
                            >
                                La base de datos aún no está cifrada.
                                La conexión futura con IA de voz tendrá
                                su propia configuración de privacidad.
                            </TextApp>
                        </View>
                    </View>
                </View>

                {/* Eliminar */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <Trash2 size={20} color={COLORS.red} />
                        </View>

                        <View>
                            <TextApp size="xl" weight="semibold">
                                Empezar de nuevo
                            </TextApp>

                            <TextApp size="sm" color="muted">
                                Eliminar tu configuración actual
                            </TextApp>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <TextApp
                            color="muted"
                            style={styles.descriptionSmall}
                        >
                            Eliminarás tu perfil, la identidad de
                            tu compañero y las preferencias guardadas.
                            Tendrás que completar nuevamente el onboarding.
                        </TextApp>

                        <Button
                            variant="destructive"
                            label="Eliminar mis datos"
                            icon={<Trash2 size={19} />}
                            size="lg"
                            fullWidth
                            disabled={deleting}
                            onPress={deleteAllData}
                        />
                    </View>
                </View>

                {/* Pie */}
                <View style={styles.footer}>
                    <View style={styles.footerBrand}>
                        <Heart
                            size={17}
                            color={COLORS.green}
                            fill={COLORS.primary}
                        />
                        <TextApp weight="bold" size="lg">
                            cerca.
                        </TextApp>
                    </View>

                    <TextApp
                        size="sm"
                        color="muted"
                        align="center"
                    >
                        Primero amigo, después asistente.
                    </TextApp>

                    <TextApp
                        size="xs"
                        color="muted"
                        align="center"
                    >
                        Versión 1.0.0 · MVP
                    </TextApp>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        gap: 30,
        paddingBottom: 24,
    },

    loading: {
        flex: 1,
        minHeight: 500,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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

    section: {
        gap: 14,
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    sectionIcon: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.light,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },

    card: {
        borderRadius: tokens.radius.xl,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
        gap: 22,
    },

    field: {
        gap: 12,
    },

    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 9,
    },

    permissionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        justifyContent: "space-between",
    },

    permissionInfo: {
        flex: 1,
        gap: 4,
    },

    hint: {
        lineHeight: 20,
    },

    privacyCard: {
        flexDirection: "row",
        gap: 14,
        borderRadius: tokens.radius.xl,
        backgroundColor: COLORS.greenBg,
        padding: 18,
    },

    privacyContent: {
        flex: 1,
        gap: 9,
    },

    privacyText: {
        lineHeight: 22,
    },

    descriptionSmall: {
        lineHeight: 23,
    },

    footer: {
        alignItems: "center",
        paddingTop: 18,
        gap: 9,
    },

    footerBrand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
});
