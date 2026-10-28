import { getDatabase } from "../database/sqlite";
import { mapCompanion } from "./profile.service";

const NAMES = {
    male: [
        "Leo",
        "Nico",
        "Mateo",
        "Lucas",
        "Bruno",
        "Gael",
        "Dante",
        "Thiago",
    ],
    female: [
        "Luna",
        "Mía",
        "Alma",
        "Vera",
        "Emma",
        "Clara",
        "Sofía",
        "Nina",
    ],
};

const OWN_INTERESTS = [
    "Fotografía",
    "Astronomía",
    "Naturaleza",
    "Música",
    "Historia",
    "Cine",
    "Arte",
    "Viajes",
    "Cocina",
    "Lectura",
    "Animales",
    "Videojuegos",
    "Deportes",
    "Tecnología",
    "Filosofía",
];

const HUMOR_STYLES = [
    "Espontáneo",
    "Ingenioso",
    "Tranquilo",
    "Juguetón",
];

const pick = (array) =>
    array[Math.floor(Math.random() * array.length)];

const score = () =>
    Math.floor(Math.random() * 51) + 30;

export function generateFriend(preference, userInterests) {
    
    const gender = preference === "random" ? pick(["male", "female"]) : preference;

    const personality = {
        openness: score(),
        conscientiousness: score(),
        extraversion: score(),
        agreeableness: score(),
        neuroticism: score(),
    };

    const name = pick(NAMES[gender]);

    // Un interés compartido es posible, pero no obligatorio.
    const sharedInterest = userInterests.length > 0 && Math.random() > 0.35 ? pick(userInterests) : null;

    const independentInterests = [...OWN_INTERESTS]
        .filter((interest) => interest !== sharedInterest)
        .sort(() => Math.random() - 0.5)
        .slice(0, sharedInterest ? 2 : 3);

    const interests = sharedInterest ? [sharedInterest, ...independentInterests] : independentInterests;

    const communicationStyle = personality.extraversion >= 60 ? "Expresivo y conversador" : "Tranquilo y observador";

    return {
        name,
        gender,
        personality,
        interests,
        humor: pick(HUMOR_STYLES),
        communicationStyle,
    };
}



let creatingPromise = null;

// La identidad se crea una única vez y nunca se vuelve a sortear.
export function getOrCreateCompanion() {
    if (!creatingPromise) {
        creatingPromise = (async () => {
            const db = await getDatabase();
            const existing = await db.getFirstAsync(
                "SELECT * FROM companion_profile WHERE id = 1"
            );
            if (existing) return mapCompanion(existing);

            const [choice, user] = await Promise.all([
                db.getFirstAsync("SELECT preference FROM companion_preferences WHERE id = 1"),
                db.getFirstAsync("SELECT interests FROM user_profile WHERE id = 1"),
            ]);

            if (!choice || !user) {
                throw new Error("Completa el registro antes de crear a tu amigo.");
            }

            let interests = [];
            try {
                const parsed = JSON.parse(user.interests || "[]");
                interests = Array.isArray(parsed) ? parsed : [];
            } catch {
                interests = [];
            }

            const generated = generateFriend(choice.preference, interests);

            await db.runAsync(
                `INSERT OR IGNORE INTO companion_profile (
                    id, name, gender, personality, interests,
                    humor, communication_style, created_at
                ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    generated.name,
                    generated.gender,
                    JSON.stringify(generated.personality),
                    JSON.stringify(generated.interests),
                    generated.humor,
                    generated.communicationStyle,
                    new Date().toISOString(),
                ]
            );

            const saved = await db.getFirstAsync(
                "SELECT * FROM companion_profile WHERE id = 1"
            );
            if (!saved) throw new Error("No se pudo guardar el compañero.");
            return mapCompanion(saved);
        })().finally(() => {
            creatingPromise = null;
        });
    }

    return creatingPromise;
}
