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

                CREATE TABLE IF NOT EXISTS app_state (
                    id INTEGER PRIMARY KEY NOT NULL,
                    first_meeting_completed INTEGER NOT NULL DEFAULT 0
                );
            `);

            return db;
        })().catch((error) => {
            databasePromise = null;
            throw error;
        });
    }

    return databasePromise;
}
