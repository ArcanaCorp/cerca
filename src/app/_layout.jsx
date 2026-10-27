import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AppProvider } from "../context/AppContext";
import { useApp } from "../hooks/useApp";
import { tokens } from "../styles/tokens";

import LightOutfit from "../../assets/fonts/Outfit-Light.ttf";
import RegularOutfit from "../../assets/fonts/Outfit-Regular.ttf";
import MediumOutfit from "../../assets/fonts/Outfit-Medium.ttf";
import SemiBoldOutfit from "../../assets/fonts/Outfit-SemiBold.ttf";
import BoldOutfit from "../../assets/fonts/Outfit-Bold.ttf";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Routes() {
    const { ready, stage, error, refresh } = useApp();

    useEffect(() => {
        if (ready) SplashScreen.hideAsync().catch(() => {});
    }, [ready]);

    if (!ready) return null;

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.message}>No pudimos cargar los datos de CERCA.</Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => refresh().catch(console.error)}
                    style={styles.retry}
                >
                    <Text style={styles.retryLabel}>Reintentar</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Protected guard={stage !== "home"}>
                <Stack.Screen name="(onboarding)" />
            </Stack.Protected>
            <Stack.Protected guard={stage === "home"}>
                <Stack.Screen name="home" />
                <Stack.Screen name="settings" />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        "Outfit-Light": LightOutfit,
        "Outfit-Regular": RegularOutfit,
        "Outfit-Medium": MediumOutfit,
        "Outfit-SemiBold": SemiBoldOutfit,
        "Outfit-Bold": BoldOutfit,
    });

    if (!fontsLoaded && !fontError) return null;

    return (
        <AppProvider>
            <Routes />
        </AppProvider>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 24,
        backgroundColor: tokens.colors.background,
    },
    message: {
        color: tokens.colors.text,
        textAlign: "center",
        fontSize: 16,
    },
    retry: {
        backgroundColor: tokens.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
    },
    retryLabel: { color: tokens.colors.black, fontWeight: "600" },
});
