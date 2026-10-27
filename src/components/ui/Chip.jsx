import { Pressable, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";

import TextApp from "./TextApp";
import { tokens } from "../../styles/tokens";

export default function Chip({
    label,
    selected = false,
    onPress,
    icon,
    disabled = false,
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected, disabled }}
            style={({ pressed }) => [
                styles.chip,
                selected && styles.selected,
                pressed && styles.pressed,
                disabled && styles.disabled,
            ]}
        >
            {icon && <View>{icon}</View>}

            <TextApp
                size="md"
                weight={selected ? "semibold" : "medium"}
            >
                {label}
            </TextApp>

            {selected && (
                <Check
                    size={15}
                    strokeWidth={2.5}
                    color={tokens.colors.text}
                />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
        backgroundColor: tokens.colors.white,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius.lg,
    },

    selected: {
        backgroundColor: tokens.colors.primary,
        borderColor: tokens.colors.primary,
    },

    pressed: {
        opacity: tokens.opacity.pressed,
    },

    disabled: {
        opacity: tokens.opacity.disabled,
    },
});