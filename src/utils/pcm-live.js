// Utilidades PCM16 para Gemini Live. Sin claves ni dependencias de red.
const TARGET_RATE = 16000;
const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(bytes) {
    let result = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const x = bytes[i];
        const y = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const z = i + 2 < bytes.length ? bytes[i + 2] : 0;
        const n = (x << 16) | (y << 8) | z;
        result += BASE64[(n >>> 18) & 63] + BASE64[(n >>> 12) & 63]
            + (i + 1 < bytes.length ? BASE64[(n >>> 6) & 63] : "=")
            + (i + 2 < bytes.length ? BASE64[n & 63] : "=");
    }
    return result;
}

function createPcmConverter() {
    let sourceFrames = 0;
    let nextOutputFrame = 0;
    let lastRate = null;

    return function encodeBuffer(buffer) {
        const data = buffer?.data;
        const rate = Number(buffer?.sampleRate);
        const channels = Number(buffer?.channels);
        if (!(data instanceof ArrayBuffer) || !rate || (channels !== 1 && channels !== 2)) {
            return [];
        }
        // Expo AudioStream se configura con encoding:'int16'.
        const view = new DataView(data);
        const frames = Math.floor(view.byteLength / (2 * channels));
        if (!frames) return [];

        if (lastRate !== rate) {
            lastRate = rate;
            sourceFrames = 0;
            nextOutputFrame = 0;
        }

        const output = [];
        const step = rate / TARGET_RATE;
        while (nextOutputFrame < sourceFrames + frames) {
            const offset = Math.min(frames - 1, Math.max(0, Math.floor(nextOutputFrame - sourceFrames)));
            let sample = view.getInt16(offset * channels * 2, true);
            if (channels === 2) {
                sample = Math.round((sample + view.getInt16(offset * 4 + 2, true)) / 2);
            }
            output.push(Math.min(32767, Math.max(-32768, sample)));
            nextOutputFrame += step;
        }
        sourceFrames += frames;
        const bytes = new Uint8Array(output.length * 2);
        const result = new DataView(bytes.buffer);
        for (let i = 0; i < output.length; i++) result.setInt16(i * 2, output[i], true);
        // 320 frames = 20 ms. Evita enviar grandes bloques.
        const pieces = [];
        const chunk = 640;
        for (let i = 0; i < bytes.length; i += chunk) {
            pieces.push(toBase64(bytes.subarray(i, i + chunk)));
        }
        return pieces;
    };
}

function explicitMemoryFromTranscript(text) {
    const match = String(text || "").match(/(?:recuerda\s+que|acu[eé]rdate\s+que|remember\s+that)\s+(.+)/i);
    if (!match) return "";
    const memory = match[1].trim().slice(0, 220);
    // No se almacenan automáticamente datos sensibles obvios.
    if (/contraseñ|password|\bpin\b|\bdni\b|tarjeta|\bcvv\b|bancari|diagn[oó]stic|enfermedad|salud|sexual|pol[ií]tic/i.test(memory)) {
        return "";
    }
    return memory;
}

module.exports = { toBase64, createPcmConverter, explicitMemoryFromTranscript };
