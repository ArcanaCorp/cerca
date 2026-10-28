import * as SQLite from "expo-sqlite";

// Reutilizamos una sola conexión; las pantallas nunca deben cerrarla.
let databasePromise = null;

export function getDatabase() {
    if (!databasePromise) {
        databasePromise = (async () => {
            const db = await SQLite.openDatabaseAsync("cerca.db");

            // Compatible con las tablas ya creadas por versiones previas del MVP.
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS user_profile (
                    id INTEGER PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL,
                    gender TEXT NOT NULL,
                    language TEXT NOT NULL,
                    interests TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS companion_preferences (
                    id INTEGER PRIMARY KEY NOT NULL,
                    preference TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS companion_profile (
                    id INTEGER PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    gender TEXT NOT NULL,
                    personality TEXT NOT NULL,
                    interests TEXT NOT NULL,
                    humor TEXT NOT NULL,
                    communication_style TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS conversation_turns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS memory_facts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fact TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS privacy_preferences (
                    id INTEGER PRIMARY KEY NOT NULL,
                    cloud_voice_consent INTEGER NOT NULL DEFAULT 0,
                    cloud_companion_consent INTEGER NOT NULL DEFAULT 0,
                    gemini_live_consent INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS app_state (
                    id INTEGER PRIMARY KEY NOT NULL,
                    first_meeting_completed INTEGER NOT NULL DEFAULT 0
                );
            `);

            // Migración compatible con instalaciones previas de CERCA.
            const columns = await db.getAllAsync("PRAGMA table_info(privacy_preferences)");
            if (!columns.some(column => column.name === "cloud_companion_consent")) {
                await db.execAsync(
                    "ALTER TABLE privacy_preferences ADD COLUMN cloud_companion_consent INTEGER NOT NULL DEFAULT 0"
                );
            }

            const liveColumns = await db.getAllAsync("PRAGMA table_info(privacy_preferences)");
            if (!liveColumns.some(column => column.name === "gemini_live_consent")) {
                await db.execAsync(
                    "ALTER TABLE privacy_preferences ADD COLUMN gemini_live_consent INTEGER NOT NULL DEFAULT 0"
                );
            }

            return db;
        })().catch((error) => {
            databasePromise = null;
            throw error;
        });
    }

    return databasePromise;
}
