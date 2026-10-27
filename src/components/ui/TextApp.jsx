import { Text } from "react-native";
import { tokens } from "../../styles/tokens";

export default function TextApp ({ children, size='md', weight='regular', color='text', align, style }) {
    return (
        <Text 
            style={[
                {
                    fontSize: tokens.fontSize[size], 
                    fontFamily: tokens.fontWeight[weight], 
                    color: tokens.colors[color],
                    textAlign: align
                },
                style
            ]}
        >
            {children}
        </Text>
    )
}