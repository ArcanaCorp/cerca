// Rechazar resultados de moderación que no son respuestas del compañero.
export function isNonConversationalReply(value) {
    if (typeof value !== "string") return false;
    return /^(?:user\s+safety|response\s+safety)\s*:/i.test(value.trim());
}
