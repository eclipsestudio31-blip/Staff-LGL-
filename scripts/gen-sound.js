const fs = require("fs");
const path = require("path");

const sampleRate = 44100;
const duration = 0.3;
const frequency = 880;
const samples = Math.floor(sampleRate * duration);
const buffer = Buffer.alloc(44 + samples * 2);

// WAV header
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + samples * 2, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(samples * 2, 40);

// Sine wave beep with fade
for (let i = 0; i < samples; i++) {
  const t = i / sampleRate;
  const fade = 1 - i / samples;
  const val = Math.sin(2 * Math.PI * frequency * t) * fade * 0.4;
  buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
}

fs.writeFileSync(path.join(__dirname, "..", "public", "sounds", "notification.wav"), buffer);
console.log("Notification sound created!");
