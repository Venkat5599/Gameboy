// Renders the soundtrack with the console's own synth: the game's sounds and music, placed on the film's timeline.
// Usage: bun scripts/audio.ts  ->  public/score.wav
import { Sound } from "../src/engine/sound";
import { Mixer } from "../src/engine/synth";
import { DURATION, FPS, GOLD_PEARL, MEME, PEARLS, PRESS_TRAVEL, PRESSES, T, TILES, VIEW_W } from "../src/timeline";

const RATE = 44_100;
const s: Sound[] = Array.from({ length: 32 }, () => new Sound());
// Same definitions as ScrappyBoy's constructor in game.ts.
s[0]!.set("c3 e3", "p", "4", "n", 2); // move
s[1]!.set("g3 c4 e4 g4", "s", "5", "n n n f", 3); // success
s[2]!.set("c2 a1 f1", "n", "6", "f", 6); // splash
s[3]!.set("c2 c1", "s", "6", "n f", 8); // error
s[4]!.set("c1 c1", "n", "7", "f", 4); // hurt
s[5]!.set("c3 g3 c4 e4 g4 c4", "p", "5", "n", 4); // fanfare
s[6]!.set("c4 g3 c4 g4", "s", "6", "n n n f", 3); // level up
["c3", "d3", "e3", "g3", "a3", "c4", "d4", "e4"].forEach((n, i) => s[20 + i]!.set(`${n} ${n}`, "p", "5 3", "n f", 2));
s[10]!.set("c2 c2 g1 g1 a1 a1 e1 e1", "t", "5", "n", 10);
s[11]!.set("e3 g3 a3 c4 a3 g3 e3 d3 e3 g3 c4 d4 e4 d4 c4 a3", "s", "3", "n", 10);
s[12]!.set("c1 g0 a0 e0 f0 c0 f0 g0", "t", "4", "n", 30);
s[13]!.set("e3 r g3 r a3 g3 e3 r f3 r a3 r g3 f3 e3 r", "t", "2", "n", 15);

interface Ev {
  f: number;
  ch: number;
  ids?: number[];
  loop?: boolean;
}
const ev: Ev[] = [];
const play = (f: number, ch: number, ids: number[], loop = false) => ev.push({ f, ch, ids, loop });
const stop = (f: number, ch: number) => ev.push({ f, ch });

// 1. the wall: a low drone, and a blip per tile that climbs as they pile up
play(0, 2, [12], true);
const seen = TILES.filter((t) => t.x < VIEW_W && t.x + t.w > 0).sort((a, b) => a.at - b.at);
let last = -9;
seen.forEach((t, n) => {
  if (t.at - last < 2) return;
  last = t.at;
  play(t.at, 0, [20 + Math.min(7, Math.floor((n / seen.length) * 8))]);
});
stop(T.hard, 2);
play(T.hard, 1, [3]);
play(T.hard, 0, [4]);
// 2. it falls, the console clicks together, boots
play(T.fall, 0, [2]);
for (let f = T.build0 + 4; f < T.build1 - 2; f += 6) play(f, 1, [0]);
play(T.build1, 0, [1]);
play(T.boot, 1, [5]);
play(T.pressA, 0, [0]);
// 3. the round: the game's round music, a pearl note per catch
play(T.round, 2, [10], true);
play(T.round, 3, [11], true);
PEARLS.forEach((p, k) => play(T.round + p, 0, [k === GOLD_PEARL ? 6 : 20 + (k % 8)]));
// 4. the mechanism: calmer menu music, one coin, then a note per landed block
play(T.pull, 2, [12], true);
play(T.pull, 3, [13], true);
play(T.coin0, 0, [0]);
play(T.coin1, 0, [1]);
PRESSES.forEach((p, i) => {
  play(p, 1, [0]);
  play(p + PRESS_TRAVEL, 0, [20 + i]);
});
// 5. recap
play(T.recap, 0, [5]);
play(T.recap + 50, 1, [1]);
// cartridge two: a swap thunk, a blip to pick, success on the buy, level-up on the sell
play(T.meme, 0, [2]);
play(T.meme + MEME.pick, 0, [0]);
play(T.meme + MEME.buy, 0, [1]);
play(T.meme + MEME.sell, 0, [6]);
play(T.meme + MEME.duel, 0, [5]); // the duel card

ev.sort((a, b) => a.f - b.f);
const total = Math.round((DURATION / FPS) * RATE);
const master = new Float32Array(total);
const mixer = new Mixer();
let pos = 0;
const renderTo = (end: number) => {
  if (end <= pos) return;
  const seg = new Float32Array(end - pos);
  mixer.render(seg, RATE);
  master.set(seg, pos);
  pos = end;
};
for (const e of ev) {
  renderTo(Math.min(total, Math.round((e.f / FPS) * RATE)));
  const ch = mixer.channels[e.ch]!;
  if (e.ids) ch.play(e.ids.map((i) => s[i]!), e.ids, !!e.loop);
  else ch.stop();
}
renderTo(total);

// gain, a one-second fade at the end, 16-bit mono WAV
const fade = RATE;
const pcm = new Int16Array(total);
for (let i = 0; i < total; i++) {
  const g = i > total - fade ? (total - i) / fade : 1;
  pcm[i] = Math.round(Math.max(-1, Math.min(1, master[i]! * 2.2 * g)) * 32767);
}
const header = new DataView(new ArrayBuffer(44));
const str = (o: number, t: string) => [...t].forEach((c, i) => header.setUint8(o + i, c.charCodeAt(0)));
str(0, "RIFF");
header.setUint32(4, 36 + pcm.byteLength, true);
str(8, "WAVEfmt ");
header.setUint32(16, 16, true);
header.setUint16(20, 1, true);
header.setUint16(22, 1, true);
header.setUint32(24, RATE, true);
header.setUint32(28, RATE * 2, true);
header.setUint16(32, 2, true);
header.setUint16(34, 16, true);
str(36, "data");
header.setUint32(40, pcm.byteLength, true);
await Bun.write(new URL("../public/score.wav", import.meta.url), new Blob([header.buffer, pcm.buffer]));
console.log(`score.wav: ${(total / RATE).toFixed(1)} s, ${ev.length} events`);
