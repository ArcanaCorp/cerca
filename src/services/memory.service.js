import { getDatabase } from "../database/sqlite";
import { isNonConversationalReply } from "../utils/reply-quality";

const MAX_HISTORY = 12;
const MAX_MEMORIES = 25;

export async function getConversationContext() {
    const db = await getDatabase();

    const [turns, memories] = await Promise.all([
        db.getAllAsync(
            "SELECT role, content FROM conversation_turns ORDER BY id DESC LIMIT ?",
            [MAX_HISTORY]
        ),
        db.getAllAsync(
            "SELECT fact FROM memory_facts ORDER BY updated_at DESC LIMIT ?",
            [MAX_MEMORIES]
        ),
    ]);

    return {
        history: turns.reverse().filter((turn) => (
            turn.role !== "assistant" || !isNonConversationalReply(turn.content)
        )).map((turn) => ({
            role: turn.role,
            content: turn.content,
        })),
        memories: memories.map((memory) => memory.fact),
    };
}

export async function saveConversation({ transcript, reply, memory = "" }) {
    if (isNonConversationalReply(reply)) {
        throw new Error("El proveedor devolvió una clasificación en lugar de una respuesta de CERCA.");
    }
    const db = await getDatabase();
    const now = new Date().toISOString();

    // Solo aceptamos memorias pedidas explícitamente por el usuario.
    const requestedMemory = /\b(recuerda|acu[eé]rdate|remember)\b/i.test(transcript);
    const fact = typeof memory === "string" ? memory.trim().slice(0, 220) : "";

    await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
            "INSERT INTO conversation_turns (role, content, created_at) VALUES (?, ?, ?)",
            ["user", transcript.trim(), now]
        );
        await txn.runAsync(
            "INSERT INTO conversation_turns (role, content, created_at) VALUES (?, ?, ?)",
            ["assistant", reply.trim(), now]
        );

        if (requestedMemory && fact) {
            await txn.runAsync(
                `INSERT INTO memory_facts (fact, created_at, updated_at)
                 VALUES (?, ?, ?)
                 ON CONFLICT(fact) DO UPDATE SET updated_at = excluded.updated_at`,
                [fact, now, now]
            );
        }
    });
}

export async function clearConversationMemory() {
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync("DELETE FROM conversation_turns; DELETE FROM memory_facts;");
    });
}

export async function getMemoryStats() {
    const db = await getDatabase();
    const [turns, facts] = await Promise.all([
        db.getFirstAsync("SELECT COUNT(*) AS total FROM conversation_turns"),
        db.getFirstAsync("SELECT COUNT(*) AS total FROM memory_facts"),
    ]);
    return { turns: turns?.total ?? 0, facts: facts?.total ?? 0 };
}
