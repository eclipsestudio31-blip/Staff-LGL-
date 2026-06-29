const fs = require("fs");
const path = require("path");

const sampleRate = 44100;
const soundsDir = path.join(__dirname, "..", "public", "sounds");

function createWav(samples, sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
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
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
  }
  return buffer;
}

// Sound 1: Classic beep (880Hz ascending)
function genClassic() {
  const duration = 0.25;
  const samples = Math.floor(sampleRate * duration);
  const data = [];
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, (samples - i) / (sampleRate * 0.05));
    const freq = 880 + (i / samples) * 220;
    data.push(Math.sin(2 * Math.PI * freq * t) * fade * 0.35);
  }
  return data;
}

// Sound 2: Double ding (1200Hz + 1600Hz)
function genDing() {
  const data = [];
  const dur1 = 0.15;
  const dur2 = 0.2;
  const gap = 0.05;
  const total = dur1 + gap + dur2;
  const samples = Math.floor(sampleRate * total);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let val = 0;
    if (t < dur1) {
      const fade = 1 - t / dur1;
      val = Math.sin(2 * Math.PI * 1200 * t) * fade * 0.35;
    } else if (t > dur1 + gap) {
      const t2 = t - dur1 - gap;
      const fade = 1 - t2 / dur2;
      val = Math.sin(2 * Math.PI * 1600 * t2) * fade * 0.35;
    }
    data.push(val);
  }
  return data;
}

fs.writeFileSync(path.join(soundsDir, "classic.wav"), createWav(genClassic(), sampleRate));
fs.writeFileSync(path.join(soundsDir, "ding.wav"), createWav(genDing(), sampleRate));
console.log("Sounds created: classic.wav, ding.wav");
