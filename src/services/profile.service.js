import { getDatabase } from "../database/sqlite";

const parseArray = (value) => {
    try {
        const result = JSON.parse(value || "[]");
        return Array.isArray(result) ? result : [];
    } catch {
        return [];
    }
};

const parseObject = (value) => {
    try {
        const result = JSON.parse(value || "{}");
        return result && typeof result === "object" ? result : {};
    } catch {
        return {};
    }
};

export function mapCompanion(row) {
    if (!row) return null;

    return {
        name: row.name,
        gender: row.gender,
        personality: parseObject(row.personality),
        interests: parseArray(row.interests),
        humor: row.humor,
        communicationStyle: row.communication_style,
        createdAt: row.created_at,
    };
}

export async function getAppSnapshot() {
    const db = await getDatabase();

    const [profile, preferences, companion, state] = await Promise.all([
        db.getFirstAsync("SELECT * FROM user_profile WHERE id = 1"),
        db.getFirstAsync("SELECT * FROM companion_preferences WHERE id = 1"),
        db.getFirstAsync("SELECT * FROM companion_profile WHERE id = 1"),
        db.getFirstAsync("SELECT * FROM app_state WHERE id = 1"),
    ]);

    return {
        user: profile
            ? {
                name: profile.name,
                age: profile.age,
                gender: profile.gender,
                language: profile.language,
                interests: parseArray(profile.interests),
            }
            : null,
        preference: preferences?.preference ?? null,
        companion: mapCompanion(companion),
        firstMeetingCompleted: state?.first_meeting_completed === 1,
    };
}

export async function saveUserProfile(profile) {
    const db = await getDatabase();

    await db.runAsync(
        `INSERT INTO user_profile (id, name, age, gender, language, interests)
         VALUES (1, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             age = excluded.age,
             gender = excluded.gender,
             language = excluded.language,
             interests = excluded.interests`,
        [
            profile.name.trim(),
            profile.age,
            profile.gender,
            profile.language,
            JSON.stringify(profile.interests),
        ]
    );
}

export async function saveFriendPreference(preference) {
    const db = await getDatabase();

    await db.runAsync(
        `INSERT INTO companion_preferences (id, preference)
         VALUES (1, ?)
         ON CONFLICT(id) DO UPDATE SET preference = excluded.preference`,
        [preference]
    );
}

export async function markFirstMeetingComplete() {
    const db = await getDatabase();

    await db.runAsync(
        `INSERT INTO app_state (id, first_meeting_completed)
         VALUES (1, 1)
         ON CONFLICT(id) DO UPDATE SET first_meeting_completed = 1`
    );
}

export async function resetAllLocalData() {
    const db = await getDatabase();

    await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync(`
            DELETE FROM conversation_turns;
            DELETE FROM memory_facts;
            DELETE FROM privacy_preferences;
            DELETE FROM app_state;
            DELETE FROM companion_profile;
            DELETE FROM companion_preferences;
            DELETE FROM user_profile;
        `);
    });
}

export async function getVoiceConsent() {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
        "SELECT cloud_voice_consent FROM privacy_preferences WHERE id = 1"
    );
    return row?.cloud_voice_consent === 1;
}

export async function setVoiceConsent(granted) {
    const db = await getDatabase();
    await db.runAsync(
        `INSERT INTO privacy_preferences (id, cloud_voice_consent)
         VALUES (1, ?)
         ON CONFLICT(id) DO UPDATE SET cloud_voice_consent = excluded.cloud_voice_consent`,
        [granted ? 1 : 0]
    );
}
