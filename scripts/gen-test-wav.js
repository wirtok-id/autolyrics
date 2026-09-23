// Generate 30s test WAV (sine tones) for fast render E2E test
const fs = require("fs");
const path = require("path");

const sampleRate = 44100;
const seconds = 30;
const numSamples = sampleRate * seconds;
const dataSize = numSamples * 2; // 16-bit mono

const buf = Buffer.alloc(44 + dataSize);

// RIFF header
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); // fmt chunk size
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(sampleRate, 24);
buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
buf.writeUInt16LE(2, 32); // block align
buf.writeUInt16LE(16, 34); // bits per sample
buf.write("data", 36);
buf.writeUInt32LE(dataSize, 40);

// Melody-ish tones changing every 2 seconds (so it's not a flat tone)
const notes = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const noteIdx = Math.floor(t / 2) % notes.length;
  const freq = notes[noteIdx];
  const env = 0.3 + 0.2 * Math.sin(2 * Math.PI * 2 * t); // slow amplitude LFO
  const sample = Math.sin(2 * Math.PI * freq * t) * env;
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(sample * 32767))), 44 + i * 2);
}

const outPath = path.join(process.cwd(), "public", "uploads", "test-tone-30s.wav");
fs.writeFileSync(outPath, buf);
console.log("Wrote", outPath, buf.length, "bytes,", seconds, "s");
