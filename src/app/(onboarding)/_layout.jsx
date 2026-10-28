import { Stack } from "expo-router";

// Declara (onboarding) como una ruta de grupo real para el Stack raíz.
// Sin este layout, Expo Router registra sus pantallas como rutas aplanadas
// y <Stack.Screen name="(onboarding)" /> genera un warning.
export default function OnboardingLayout() {
    return <Stack screenOptions={{ headerShown: false }} />;
}
