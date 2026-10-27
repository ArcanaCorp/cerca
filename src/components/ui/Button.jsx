
import { cloneElement, isValidElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import TextApp from "./TextApp";
import { tokens } from "../../styles/tokens";

const { colors, radius, opacity, size: sizes } = tokens;

const variants = {
    default: {
        background: colors.black,
        text: colors.white,
        border: colors.black,
    },

    primary: {
        background: colors.primary,
        text: colors.black,
        border: colors.primary,
    },

    secondary: {
        background: colors.light,
        text: colors.text,
        border: colors.light,
    },

    outline: {
        background: "transparent",
        text: colors.green,
        border: colors.green,
    },

    ghost: {
        background: "transparent",
        text: colors.text,
        border: "transparent",
    },

    destructive: {
        background: colors.red,
        text: colors.white,
        border: colors.red,
    },

    disabled: {
        background: colors.light,
        text: colors.muted,
        border: colors.border,
    },
};

const heights = {
    sm: sizes.buttonSm,
    md: sizes.buttonMd,
    lg: sizes.buttonLg,
};

export default function Button({
    label,
    variant = "default",
    size = "md",
    rounded = "xl",
    icon,
    iconOnly = false,
    iconPosition = "right",
    onPress,
    disabled = false,
    fullWidth = false,
    style,
    accessibilityLabel,
}) {
    const isDisabled = disabled || variant === "disabled";

    const theme = isDisabled
        ? variants.disabled
        : variants[variant] ?? variants.default;

    const height = heights[size] ?? heights.md;

    const iconColor = theme.text;

    // Adapta automáticamente los iconos Lucide
    // al color de la variante.
    const renderedIcon = isValidElement(icon)
        ? cloneElement(icon, {
              color: iconColor,
          })
        : icon;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={
                accessibilityLabel ?? label ?? "Botón"
            }
            accessibilityState={{ disabled: isDisabled }}
            hitSlop={iconOnly && size === "sm" ? 4 : 0}
            style={({ pressed }) => [
                styles.button,
                {
                    height,
                    width: iconOnly
                        ? height
                        : fullWidth
                            ? "100%"
                            : undefined,
                    paddingHorizontal: iconOnly ? 0 : 22,
                    borderRadius:
                        radius[rounded] ?? radius.xl,
                    backgroundColor: theme.background,
                    borderWidth:
                        variant === "outline" || isDisabled
                            ? 1
                            : 0,
                    borderColor: theme.border,
                    opacity: isDisabled
                        ? 1
                        : pressed
                            ? opacity.pressed
                            : 1,
                },
                style,
            ]}
        >
            <View style={styles.content}>
                {iconPosition === "left" && renderedIcon}

                {!iconOnly && (
                    <TextApp
                        size="lg"
                        weight="semibold"
                        style={{ color: theme.text }}
                    >
                        {label}
                    </TextApp>
                )}

                {iconPosition === "right" && renderedIcon}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: "center",
        justifyContent: "center",
    },

    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
});