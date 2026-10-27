import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import LightOutfit from "../../assets/fonts/Outfit-Light.ttf"
import RegularOutfit from "../../assets/fonts/Outfit-Regular.ttf"
import MediumOutfit from "../../assets/fonts/Outfit-Medium.ttf"
import SemiBoldOutfit from "../../assets/fonts/Outfit-SemiBold.ttf"
import BoldOutfit from "../../assets/fonts/Outfit-Bold.ttf"
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Routes ({ fontsReady }) {
    useEffect(() => {
        if (fontsReady) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [fontsReady]);

    return (
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="index"/>
        </Stack>
    )

}

export default function RootLayout () {

    const [ fontLoad, fontError ] = useFonts({
        'Outfit-Light': LightOutfit,
        'Outfit-Regular': RegularOutfit,
        'Outfit-Medium': MediumOutfit,
        'Outfit-SemiBold': SemiBoldOutfit,
        'Outfit-Bold': BoldOutfit,
    })

    if (!fontLoad && !fontError) return null;

    return (
        <>
            <Routes fontsReady={fontLoad || !!fontError} />
        </>
    )
}