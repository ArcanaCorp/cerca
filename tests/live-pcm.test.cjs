'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { toBase64, createPcmConverter, explicitMemoryFromTranscript } = require('../src/utils/pcm-live.js');

test('PCM16 encode base64 matches Buffer', () => {
  const input = Uint8Array.from([0,1,2,253,254,255]);
  assert.equal(toBase64(input), Buffer.from(input).toString('base64'));
});
test('PCM mono 16 kHz remains valid PCM little-endian', () => {
  const pcm = new Int16Array([100, -100, 32767, -32768]);
  const convert = createPcmConverter();
  const result = convert({ data:pcm.buffer, sampleRate:16000, channels:1 });
  assert.equal(result.length, 1);
  assert.deepEqual(Buffer.from(result[0], 'base64'), Buffer.from(pcm.buffer));
});
test('PCM 48 kHz downsample 3 to 1', () => {
  const pcm = new Int16Array(480);
  pcm.fill(4321);
  const convert = createPcmConverter();
  const result = convert({ data:pcm.buffer,sampleRate:48000,channels:1 });
  assert.equal(Buffer.concat(result.map(s=>Buffer.from(s,'base64'))).byteLength,320);
});
test('memory only when user explicitly asks', () => {
  assert.equal(explicitMemoryFromTranscript('Hola, ¿qué tal?'),'');
  assert.equal(explicitMemoryFromTranscript('Recuerda que me gusta el té verde'),'me gusta el té verde');
  assert.equal(explicitMemoryFromTranscript('Recuerda que mi contraseña es 1234'),'');
});
