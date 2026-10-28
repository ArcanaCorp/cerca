const API_BASE = process.env.EXPO_PUBLIC_CERCA_API_URL?.trim().replace(/\/$/, "");

export async function getLiveSession({ signal } = {}) {
    if (!API_BASE || !API_BASE.startsWith("https://")) {
        throw new Error("Configura EXPO_PUBLIC_CERCA_API_URL con HTTPS.");
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) controller.abort();

    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(`${API_BASE}/api/live-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
            signal: controller.signal,
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error || "No pudimos conectar con Gemini Live.");
        if (
            typeof json.token !== "string" ||
            typeof json.model !== "string" ||
            typeof json.websocketUrl !== "string" ||
            !json.websocketUrl.startsWith("wss://generativelanguage.googleapis.com/")
        ) {
            throw new Error("La API no devolvió una sesión Live válida.");
        }
        return json;
    } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
    }
}
