import { View, TextInput, StyleSheet } from "react-native";

import TextApp from "./TextApp";
import { tokens } from "../../styles/tokens";

export default function Input({
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    autoCapitalize = "sentences",
    maxLength,
    secureTextEntry = false,
    icon,
    error,
    disabled = false,
    ...props
}) {
    return (
        <View style={styles.container}>
            {label && (
                <TextApp size="lg" weight="semibold">
                    {label}
                </TextApp>
            )}

            <View
                style={[
                    styles.inputContainer,
                    error && styles.inputError,
                    disabled && styles.disabled,
                ]}
            >
                {icon && (
                    <View style={styles.icon}>
                        {icon}
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={tokens.colors.gray}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    secureTextEntry={secureTextEntry}
                    editable={!disabled}
                    selectionColor={tokens.colors.green}
                    {...props}
                />
            </View>

            {error && (
                <TextApp size="sm" color="red">
                    {error}
                </TextApp>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: tokens.size.inputLg,
        backgroundColor: tokens.colors.white,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius.xl,
        paddingHorizontal: 16,
    },

    input: {
        flex: 1,
        minHeight: tokens.size.inputLg,
        fontFamily: tokens.fontWeight.regular,
        fontSize: tokens.fontSize.lg,
        color: tokens.colors.text,
        paddingVertical: 0,
    },

    icon: {
        marginRight: 12,
    },

    inputError: {
        borderColor: tokens.colors.red,
    },

    disabled: {
        opacity: tokens.opacity.disabled,
        backgroundColor: tokens.colors.light,
    },
});