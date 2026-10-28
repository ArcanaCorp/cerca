const test = require("node:test");
const assert = require("node:assert/strict");

const handler = require("../api/voice-turn.js");

function request(audioText = "Hola, ¿cómo estás?") {
    return {
        method: "POST",
        body: {
            audio: Buffer.alloc(80, 5).toString("base64"),
            mimeType: "audio/mp4",
            user: { name: "Franco", language: "es", interests: ["Cine"] },
            companion: {
                name: "Lucas",
                personality: { openness: 64, extraversion: 45 },
                interests: ["Astronomía"],
            },
            history: [{ role: "user", content: "¿Cómo estás?" }],
            memories: ["Le gusta el té verde"],
            _testTranscript: audioText,
        },
    };
}

async function invoke(req) {
    let code = 200;
    let payload;

    const res = {
        setHeader() {},
        status(value) {
            code = value;
            return this;
        },
        json(value) {
            payload = value;
            return this;
        },
    };

    await handler(req, res);
    return { code, payload };
}

test("rechaza otros métodos", async () => {
    const result = await invoke({ method: "GET", body: {} });
    assert.equal(result.code, 405);
});

test("rechaza audio inválido", async () => {
    const original = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-only";
    try {
        const result = await invoke({
            method: "POST",
            body: { audio: "mal", mimeType: "audio/mp4" },
        });
        assert.equal(result.code, 400);
    } finally {
        if (original === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = original;
    }
});

test("transcribe y responde sin guardar estado remoto", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    const originalFetch = global.fetch;
    const seen = [];

    process.env.OPENAI_API_KEY = "test-only";

    global.fetch = async (url, options) => {
        seen.push({ url, options });

        if (url.endsWith("/audio/transcriptions")) {
            return {
                ok: true,
                json: async () => ({ text: "Recuerda que me gusta el té verde." }),
            };
        }

        return {
            ok: true,
            json: async () => ({
                output: [
                    {
                        content: [
                            {
                                type: "output_text",
                                text: JSON.stringify({
                                    reply: "¡Anotado! ¿Cuál te gusta más?",
                                    memory: "Le gusta el té verde",
                                }),
                            },
                        ],
                    },
                ],
            }),
        };
    };

    try {
        const result = await invoke(request());
        assert.equal(result.code, 200);
        assert.equal(result.payload.reply, "¡Anotado! ¿Cuál te gusta más?");
        assert.equal(result.payload.memory, "Le gusta el té verde");

        assert.equal(seen.length, 2);
        const responseBody = JSON.parse(seen[1].options.body);
        assert.equal(responseBody.store, false);
        assert.equal(responseBody.input.at(-1).content, "Recuerda que me gusta el té verde.");
        assert.match(responseBody.instructions, /Lucas/);
    } finally {
        global.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalKey;
    }
});

test("no guarda una memoria que no fue solicitada", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    const originalFetch = global.fetch;
    process.env.OPENAI_API_KEY = "test-only";

    global.fetch = async (url) => {
        if (url.endsWith("/audio/transcriptions")) {
            return { ok: true, json: async () => ({ text: "Hola, ¿qué tal?" }) };
        }

        return {
            ok: true,
            json: async () => ({
                output: [{
                    content: [{
                        type: "output_text",
                        text: JSON.stringify({ reply: "¡Hola!", memory: "algo no solicitado" }),
                    }],
                }],
            }),
        };
    };

    try {
        const result = await invoke(request());
        assert.equal(result.code, 200);
        assert.equal(result.payload.memory, "");
    } finally {
        global.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalKey;
    }
});
