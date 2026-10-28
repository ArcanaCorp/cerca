import { getDatabase } from "../database/sqlite";
import { mapCompanion, getCompanionConsent } from "./profile.service";
import { debugVoice, debugVoiceError } from "../utils/voice-debug";

let creationPromise = null;

function getApiUrl() {
    const base = process.env.EXPO_PUBLIC_CERCA_API_URL?.trim().replace(/\/$/, "");
    if (!base || !base.startsWith("https://")) {
        throw new Error("Configura EXPO_PUBLIC_CERCA_API_URL con la API HTTPS de CERCA.");
    }
    return `${base}/api/companion`;
}

function validateIdentity(value, preference) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("El servicio devolvió una identidad inválida.");
    }
    const { name, gender, personality, interests, humor, communicationStyle } = value;
    if (
        typeof name !== "string" || name.trim().length < 2 || name.length > 40 ||
        !["male", "female"].includes(gender) ||
        (preference !== "random" && gender !== preference) ||
        typeof humor !== "string" || !humor.trim() ||
        typeof communicationStyle !== "string" || !communicationStyle.trim() ||
        !Array.isArray(interests) || interests.length < 3 ||
        interests.some(item => typeof item !== "string" || !item.trim())
    ) {
        throw new Error("La IA generó una identidad incompleta. Vuelve a intentarlo.");
    }
    const traits = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
    if (!personality || traits.some(trait =>
        !Number.isInteger(personality[trait]) ||
        personality[trait] < 0 || personality[trait] > 100
    )) {
        throw new Error("La IA devolvió rasgos de personalidad inválidos.");
    }
    return { name: name.trim(), gender, personality, interests: interests.slice(0, 5), humor, communicationStyle };
}

async function generateFromAI(preference, user) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
        debugVoice("companion_api_request", { preference, interestCount: user.interests.length });
        const response = await fetch(getApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                preference,
                user: { name: user.name, language: user.language, interests: user.interests }
            }),
            signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        const requestId = response.headers?.get?.("X-CERCA-Request-ID") || data.requestId || null;
        debugVoice("companion_api_response", { status: response.status, code: data.code || null, requestId });
        if (!response.ok) {
            const error = new Error(data.error || "No pudimos generar a tu compañero.");
            error.status = response.status;
            error.code = data.code || "unknown_error";
            error.requestId = requestId;
            throw error;
        }
        return validateIdentity(data, preference);
    } catch (error) {
        debugVoiceError("companion_api_failed", error);
        if (error.name === "AbortError") throw new Error("La IA tardó demasiado. Intenta nuevamente.");
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

// No se generan listas locales, nombres de ejemplo ni personalidades aleatorias.
// Una vez creada la identidad, se conserva de forma estable en SQLite.
export function getOrCreateCompanion() {
    if (!creationPromise) {
        creationPromise = (async () => {
            const db = await getDatabase();
            const existing = await db.getFirstAsync("SELECT * FROM companion_profile WHERE id = 1");
            if (existing) return mapCompanion(existing);

            if (!(await getCompanionConsent())) {
                throw new Error("Se requiere autorización para crear la identidad con IA.");
            }

            const [choice, user] = await Promise.all([
                db.getFirstAsync("SELECT preference FROM companion_preferences WHERE id = 1"),
                db.getFirstAsync("SELECT * FROM user_profile WHERE id = 1"),
            ]);
            if (!choice || !user) throw new Error("Completa el registro antes de generar tu compañero.");

            let interests = [];
            try {
                const parsed = JSON.parse(user.interests || "[]");
                interests = Array.isArray(parsed) ? parsed : [];
            } catch {}

            const identity = await generateFromAI(choice.preference, {
                name: user.name,
                language: user.language,
                interests,
            });

            await db.runAsync(
                `INSERT OR IGNORE INTO companion_profile
                    (id, name, gender, personality, interests, humor, communication_style, created_at)
                 VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    identity.name,
                    identity.gender,
                    JSON.stringify(identity.personality),
                    JSON.stringify(identity.interests),
                    identity.humor,
                    identity.communicationStyle,
                    new Date().toISOString(),
                ]
            );

            const saved = await db.getFirstAsync("SELECT * FROM companion_profile WHERE id = 1");
            if (!saved) throw new Error("No pudimos guardar la identidad generada.");
            return mapCompanion(saved);
        })().finally(() => {
            creationPromise = null;
        });
    }
    return creationPromise;
}
