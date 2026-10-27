const springGreen = {
    50: '#eefff3',
    100: '#d7ffe4',
    200: '#b1ffca',
    300: '#75ffa4',
    400: '#50f789',
    500: '#08df52',
    600: '#00ba40',
    700: '#049135',
    800: '#09722e',
    900: '#0a5d29',
    950: '#003515',
};

export const tokens = {

    colors: {
        primary: springGreen[400],
        white: "#FFFFFF",
        black: "#181818",
        gray: "#888888",
        background: "#fafafa",
        text: "#18181b",
        muted: "#71717a",
        border: "#e4e4e7",
        light: "#f4f4f5",
        green: "#15803d",
        greenBg: "#f0fdf4",
        orange: "#c2410c",
        orangeBg: "#fff7ed",
        blue: "#1d4ed8",
        blueBg: "#eff6ff",
        red: "#b91c1c",
        redBg: "#fef2f2",
    },

    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        "2xl": 20,
        "3xl": 24,
        "4xl": 28,
        "5xl": 32,
        "6xl": 40,
    },

    fontWeight: {
        light: 'Outfit-Light',
        regular: 'Outfit-Regular',
        medium: 'Outfit-Medium',
        semibold: 'Outfit-SemiBold',
        bold: 'Outfit-Bold',
    },

    spacing: {
        0: 0,
        1: 4,
        2: 8,
        3: 12,
        4: 16,
        5: 20,
        6: 24,
        8: 32,
        10: 40,
        12: 48,
        16: 64,
        20: 80,
    },

    radius: {
        none: 0,
        xs: 4,
        sm: 6,
        md: 10,
        lg: 14,
        xl: 20,
        "2xl": 24,
        "3xl": 32,
        full: 999,
    },

    borderWidth: {
        none: 0,
        hairline: 0.5,
        thin: 1,
        medium: 1.5,
        thick: 2,
    },

    iconSize: {
        xs: 14,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 28,
        "2xl": 32,
        "3xl": 40,
    },

    size: {
        inputSm: 40,
        inputMd: 48,
        inputLg: 56,

        buttonSm: 36,
        buttonMd: 46,
        buttonLg: 56,

        touch: 44,

        header: 60,
        tabBar: 64,

        avatarSm: 32,
        avatarMd: 40,
        avatarLg: 56,
    },

    opacity: {
        disabled: 0.5,
        pressed: 0.75,
        muted: 0.6,
        overlay: 0.45,
    },

}