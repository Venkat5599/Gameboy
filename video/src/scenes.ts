import { Image } from "./engine/image";
import { SPRITES } from "./engine/sprites";
import sol from "./data/sol.json";
import skr from "./data/skr.json";
import { ACTIONS, GOLD_PEARL, MEME, PEARLS, PRESS_TRAVEL, PRESSES, rnd, T, TILES, WORLD_W } from "./timeline";

/**
 * The whole film is drawn here, one frame at a time, into a 640x270 indexed-colour buffer with the
 * game's own pixel engine, palette, sprites and 4x6 font. The left 480 columns are the frame at rest;
 * the extra 160 give the camera room when it pushes into the console's screen.
 */

export const W = WORLD_W;
export const H = 270;

// palette roles (indices into the console palette)
const INK = 0, PAPER = 1, LILAC = 2, VIOLET = 3, KEY = 4, DEEP = 5, MIST = 6, WHITE = 7, RED = 8, ORANGE = 9, GOLD = 10, GREEN = 11, GREY = 13, ROSE = 14, SAND = 15;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// console placement in the world
export const CX = 284;
export const CY = 8;
export const SCREEN = { x: CX + 8, y: CY + 8, w: 160, h: 144 };
/** The "Crypto is hard." band, in world pixels, so the HTML headline can sit exactly inside it. */
// Rows of tiles sit every 20 px (y = row * 20 - 5, 14 tall). The band runs 111..173, gap to gap, so it never slices a tile.
export const BAND = { mid: 142, full: 62 };
export const bandHeight = (f: number) => Math.round(BAND.full * Math.min(prog(f, T.hard, T.hard + 5), 1 - prog(f, T.fall, T.fall + 6)));

const con = new Image(W, H); // the console, composited with a key colour
const scr = new Image(160, 144); // what the console's screen shows
const glyphs = new Image(200, 6);
const bank = new Image(96, 8);
for (const [sx, frames] of Object.entries(SPRITES)) {
  const w = frames[0]![0]!.length;
  frames.forEach((rows, i) => bank.load(Number(sx) + i * w, 0, rows));
}

// ---- helpers ------------------------------------------------------------------------

function big(s: Image, x: number, y: number, str: string, col: number, k: number): void {
  glyphs.cls(0);
  glyphs.text(0, 0, str, 1);
  for (let j = 0; j < 6; j++) for (let i = 0; i < str.length * 4; i++) if (glyphs.get(i, j)) s.rect(x + i * k, y + j * k, k, k, col);
}

/** Centre a line of 4x6 text on cx. A glyph cell is 4 wide with 1 px of trailing gap, so the ink is len*4-1 wide. */
function ctext(s: Image, cx: number, y: number, str: string, col: number): void {
  s.text(Math.round(cx - (str.length * 4 - 1) / 2), y, str, col);
}

function sprite(s: Image, x: number, y: number, sx: number, f: number, k = 1): void {
  const frame = Math.floor(f / 8) % 2;
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 12; i++) {
      const c = bank.get(sx + frame * 12 + i, j);
      if (c) s.rect(x + i * k, y + j * k, k, k, c);
    }
}

function rrect(c: Image, x: number, y: number, w: number, h: number, col: number, key = KEY): void {
  c.rect(x, y, w, h, col);
  const cut = [4, 2, 1, 1];
  cut.forEach((n, j) => {
    c.rect(x, y + j, n, 1, key);
    c.rect(x + w - n, y + j, n, 1, key);
    c.rect(x, y + h - 1 - j, n, 1, key);
    c.rect(x + w - n, y + h - 1 - j, n, 1, key);
  });
}

// ---- backdrop -----------------------------------------------------------------------

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Ink that deepens into violet toward the floor, dithered like the hardware would. A few slow lights above. */
function backdrop(s: Image, f: number): void {
  s.cls(INK);
  for (let y = 96; y < H; y++) {
    const lv = Math.pow((y - 96) / (H - 96), 1.7) * 0.5;
    for (let x = 0; x < W; x++) if ((BAYER[(x & 3) + ((y & 3) << 2)]! + 0.5) / 16 < lv) s.data[y * W + x] = DEEP;
  }
  for (let i = 0; i < 46; i++) {
    const tw = Math.floor(f / 6 + rnd(i) * 20) % 7;
    if (tw < 4) s.pset(Math.floor(rnd(i + 1) * W), Math.floor(rnd(i + 50) * 110), tw < 1 ? LILAC : DEEP);
  }
}

// ---- what the console's screen shows -----------------------------------------------

function sea(f: number): void {
  scr.cls(PAPER);
  [MIST, LILAC, VIOLET, DEEP].forEach((c, i) => scr.rect(0, 40 + i * 26, 160, 26, c));
  for (let x = 0; x < 160; x++) scr.pset(x, 39 + Math.round(Math.sin((x + f) / 7) * 1.5), VIOLET);
  for (let i = 0; i < 8; i++) {
    const bx = (i * 41 + 13) % 160;
    const by = 140 - ((f / 2 + i * 29) % 96);
    scr.pset(bx + Math.round(Math.sin((f + i * 9) / 8)), by, WHITE);
  }
}

function title(f: number): void {
  sea(f);
  big(scr, 15, 11, "SCRAPPY BOY", INK, 3);
  big(scr, 14, 10, "SCRAPPY BOY", VIOLET, 3);
  ctext(scr, 80, 31, "KEEP THE PRICE IN YOUR NET", INK);
  [0, 24, 48].forEach((sx, i) => sprite(scr, 20 + i * 48, 66 + Math.round(Math.sin((f + i * 20) / 8) * 3), sx, f, 2));
  if (f % 24 < 16) ctext(scr, 80, 128, "PRESS A", WHITE);
}

function bootFlash(p: number): void {
  scr.cls(INK);
  const h = Math.max(1, Math.round(144 * p * p));
  scr.rect(0, 72 - Math.floor(h / 2), 160, h, p < 0.5 ? WHITE : PAPER);
}

// The round runs on SOL-USD closes from Coinbase (scripts/fetch-prices.ts). u is "minutes into the data".
const CLOSES = sol.closes.map((c) => c.c);
const CREATURE_X = 100;
const priceAt = (u: number) => {
  const i = clamp(u, 0, CLOSES.length - 1.001);
  const a = Math.floor(i);
  return lerp(CLOSES[a]!, CLOSES[a + 1]!, i - a);
};
const U0 = 17; // the creature starts 17 closes in, so the trail behind it comes from the feed too
const uAt = (rf: number, col: number) => (rf + col - CREATURE_X) / 6 + U0;
const ROUND_LEN = T.meme - T.round + 8;
const SPAN = (() => {
  let lo = Infinity, hi = -Infinity;
  for (let u = 0; u <= uAt(ROUND_LEN, CREATURE_X + 6); u += 0.25) {
    lo = Math.min(lo, priceAt(u));
    hi = Math.max(hi, priceAt(u));
  }
  const pad = (hi - lo) * 0.15 || 0.01;
  return { lo: lo - pad, hi: hi + pad };
})();
const py = (p: number) => Math.round(124 - ((p - SPAN.lo) / (SPAN.hi - SPAN.lo)) * (124 - 20));
const creatureY = (rf: number) => py(priceAt(uAt(rf, CREATURE_X)));
const NET_HALF = 16;
/** The player's net: it chases the creature a beat late, like a thumb on a d-pad. */
const netY = (rf: number) => {
  let sum = 0;
  for (let k = 1; k <= 5; k++) sum += creatureY(Math.max(0, rf - k * 6));
  return clamp(sum / 5, 28, 116);
};
export const roundPrice = (rf: number) => priceAt(uAt(rf, CREATURE_X));
/** Which way the thumb is pushing this frame (for the d-pad on the shell). */
export const steer = (rf: number) => Math.sign(Math.round(netY(rf + 3) - netY(rf)));

function round(rf: number, f: number): void {
  scr.cls(PAPER);
  for (let i = 0; i < 4; i++) {
    const lx = ((i * 53 - rf * 0.3) % 200) + 20;
    for (let y = 12; y < 134; y += 4) scr.pset(Math.round(lx + y * 0.35), y, MIST);
  }
  for (let x = 0; x < 160; x++) scr.line(x, 131 + Math.round(Math.sin((x + rf) / 9) * 1.5), x, 134, SAND);

  const cy = creatureY(rf);
  const ny = netY(rf);
  const inside = Math.abs(cy - ny) <= NET_HALF;
  const top = Math.round(ny - NET_HALF);
  const bot = Math.round(ny + NET_HALF);
  for (let y = top; y <= bot; y += 3) for (let x = (Math.floor(y / 3) % 2) * 2; x < 160; x += 4) scr.pset(x, y, MIST);
  scr.line(0, top, 159, top, inside ? GREEN : RED);
  scr.line(0, bot, 159, bot, inside ? GREEN : RED);
  for (let x = 6 - (Math.floor(rf / 2) % 16); x < 160; x += 16) scr.circ(x, top, 1, ORANGE);

  // the price line, one column per pixel, ending at the creature
  for (let x = 1; x <= CREATURE_X + 5; x++) {
    scr.line(x - 1, py(priceAt(uAt(rf, x - 1))), x, py(priceAt(uAt(rf, x))), x > CREATURE_X - 40 ? INK : GREY);
  }

  // one jellyfish drifting through, well clear of the net
  const jx = 190 - rf * 0.9;
  if (jx > -10 && jx < 170) scr.blt(Math.round(jx), 112 + Math.round(Math.sin(rf / 9) * 5), bank, 72 + (Math.floor(f / 10) % 2) * 8, 0, 8, 8, 0);

  let score = Math.floor(rf / 8) * 2;
  let combo = 0;
  PEARLS.forEach((at, k) => {
    const gold = k === GOLD_PEARL;
    const y = Math.round(netY(at) + (rnd(k + 5) - 0.5) * 14);
    const dt = rf - at;
    if (dt < 0) {
      const x = Math.round(CREATURE_X + 4 - dt * 1.6);
      if (x < 166) {
        scr.circ(x, y + Math.round(Math.sin((rf + k * 7) / 5) * 1.5), gold ? 3 : 2, gold ? GOLD : WHITE);
        scr.circb(x, y + Math.round(Math.sin((rf + k * 7) / 5) * 1.5), gold ? 3 : 2, gold ? ORANGE : VIOLET);
      }
      return;
    }
    score += gold ? 25 : 5;
    combo++;
    if (dt < 14) for (let i = 0; i < 8; i++) scr.pset(CREATURE_X + 4 + Math.cos((i * Math.PI) / 4) * dt * 1.4, y + Math.sin((i * Math.PI) / 4) * dt * 1.4 + dt * dt * 0.03, gold ? GOLD : VIOLET);
    if (dt < 22) scr.text(CREATURE_X - 2, y - 8 - Math.floor(dt / 2), gold ? "+25" : "+5", gold ? ORANGE : VIOLET);
  });

  sprite(scr, CREATURE_X - 6, cy - 4, 24, f);

  scr.rect(0, 0, 160, 9, INK);
  scr.text(3, 2, String(score), WHITE);
  scr.text(34, 2, `X${1 + Math.floor(combo / 3)}`, GREEN);
  scr.rect(58, 3, 40, 3, DEEP);
  scr.rect(58, 3, 40, 3, GREEN);
  const price = `USD ${roundPrice(rf).toFixed(2)}`; // the 4x6 font's "$" reads as an "f" at this size
  scr.text(157 - price.length * 4, 2, price, GOLD);
  scr.rect(0, 135, 160, 9, INK);
  scr.text(3, 137, "SOL PRICE", GREY);
  scr.text(113, 137, "UP/DN STEER", GREY);
  if (rf < 46) {
    scr.rect(38, 14, 84, 11, INK);
    scr.rectb(38, 14, 84, 11, WHITE);
    ctext(scr, 80, 17, "KEEP ME IN THE NET!", WHITE);
  }
}

// ---- cartridge two: MEME DASH --------------------------------------------------------
// Same rules as meme.ts: pick a coin, A buys, a safety net at -8% and a treasure line at +15%, B sells.
// The candles are SKR-USD one-minute candles from GeckoTerminal (scripts/fetch-skr.ts), replayed.

const CANDLES = skr.candles as { o: number; h: number; l: number; c: number }[];
const MEME_WIN = 24;
const STOP = -0.08;
const TAKE = 0.15;
/** Index of the newest candle on screen. Time stops at the sell. */
const memeEnd = (mf: number) => clamp(MEME_WIN + Math.floor((Math.min(mf, MEME.sell) - MEME.pick) / 5), MEME_WIN, CANDLES.length - 1);

function coin(cx: number, cy: number, r: number): void {
  scr.circ(cx, cy, r, VIOLET);
  scr.circb(cx, cy, r, DEEP);
  if (r > 10) big(scr, cx - 4, cy - 7, "S", WHITE, 3);
  else scr.text(cx - 1, cy - 2, "S", WHITE);
}

function meme(mf: number, f: number): void {
  if (mf < 6) {
    scr.cls(INK); // the cartridge swap
    return;
  }
  scr.cls(PAPER);
  scr.text(4, 4, "MEME DASH", VIOLET);
  scr.rect(119, 2, 37, 9, VIOLET);
  ctext(scr, 137.5, 4, "MAINNET", WHITE);

  if (mf < MEME.pick) {
    coin(80, 56 + Math.round(Math.sin(f / 6) * 2), 22);
    scr.tri(14, 56, 22, 48, 22, 64, LILAC);
    scr.tri(146, 56, 138, 48, 138, 64, LILAC);
    big(scr, 64, 90, "SKR", INK, 3);
    ctext(scr, 80, 114, "SEEKER", GREY);
    scr.rect(0, 135, 160, 9, INK);
    scr.text(3, 137, "< > COINS", GREY);
    scr.text(133, 137, "A PICK", GREY);
    return;
  }

  const bought = mf >= MEME.buy;
  const sold = mf >= MEME.sell;
  const e = memeEnd(mf);
  const win = CANDLES.slice(e - MEME_WIN + 1, e + 1);
  const entry = CANDLES[memeEnd(MEME.buy)]!.c;
  const live = CANDLES[e]!.c;

  coin(11, 20, 6);
  scr.text(22, 15, "SKR", INK);
  scr.text(22, 22, `${live.toPrecision(4)} USD`, GREY);

  // the chart: tight on the candles until you buy, then it opens out to show both auto-sell lines
  let lo = Math.min(...win.map((c) => c.l));
  let hi = Math.max(...win.map((c) => c.h));
  const z = eio(prog(mf, MEME.buy, MEME.buy + 12));
  lo = lerp(lo, Math.min(lo, entry * (1 + STOP)), z);
  hi = lerp(hi, Math.max(hi, entry * (1 + TAKE)), z);
  const pad = (hi - lo) * 0.08 || live * 0.01;
  lo -= pad;
  hi += pad;
  const y = (p: number) => Math.round(98 - ((p - lo) / (hi - lo)) * 64);
  scr.rect(3, 30, 154, 72, WHITE);
  scr.rectb(3, 30, 154, 72, MIST);
  scr.clip(4, 31, 152, 70);
  for (let g = 1; g < 4; g++) for (let x = 6; x < 104; x += 4) scr.pset(x, 31 + g * 17, MIST);
  win.forEach((c, i) => {
    const x = 7 + i * 4;
    const col = c.c >= c.o ? GREEN : RED;
    scr.line(x + 1, y(c.h), x + 1, y(c.l), col);
    const top = y(Math.max(c.o, c.c));
    scr.rect(x, top, 3, Math.max(1, y(Math.min(c.o, c.c)) - top), col);
  });
  const rule = (p: number, col: number, label: string, ink: number) => {
    const yy = y(p);
    for (let x = 5; x < 106; x += 4) scr.rect(x, yy, 2, 1, col);
    scr.rect(109, yy - 4, 45, 9, col);
    ctext(scr, 131.5, yy - 2, label, ink);
  };
  if (bought) {
    rule(entry * (1 + TAKE), GREEN, "TREASURE", WHITE);
    rule(entry * (1 + STOP), RED, "SAFETY", WHITE);
    rule(entry, GOLD, "YOU BUY", INK);
  }
  scr.circ(104, y(live), 2, INK);
  scr.clip();

  if (!bought) {
    scr.text(4, 107, "HOW MUCH?", GREY);
    [1, 5, 10, 25, 50].forEach((v, i) => {
      const x = 4 + i * 18;
      if (i === 0) scr.rect(x, 116, 16, 11, GOLD);
      else scr.rectb(x, 116, 16, 11, MIST);
      ctext(scr, x + 8, 119, String(v), INK);
    });
    scr.text(96, 119, "USD", GREY);
    scr.rect(118, 107, 38, 22, GREEN);
    ctext(scr, 137, 115, "A BUY", WHITE);
  } else {
    const pct = live / entry - 1;
    big(scr, 4, 107, `${pct >= 0 ? "+" : ""}${(pct * 100).toFixed(1)}%`, pct >= 0 ? GREEN : RED, 2);
    scr.text(4, 123, "ON YOUR 1 USD", GREY);
    scr.rect(112, 107, 44, 22, RED);
    ctext(scr, 134, 115, "A/B SELL", WHITE);
  }
  scr.rect(0, 135, 160, 9, INK);
  if (bought) ctext(scr, 80, 137, "SAFETY -8%   TREASURE +15%", GREY);
  else {
    scr.text(3, 137, "UP/DN AMOUNT", GREY);
    scr.text(129, 137, "B COINS", GREY);
  }

  if (sold && mf >= MEME.sell + 4) {
    const pct = live / entry - 1;
    const str = `${pct >= 0 ? "+" : ""}${(pct * 100).toFixed(1)}%`;
    if (mf >= MEME.duel) {
      // the trade duel: this result goes to a friend as the one to beat, on the same coin, with no stake
      // 33..102: ends on the chart panel's own bottom edge, clear of the result line drawn at y 107 below it
      scr.rect(18, 33, 124, 69, INK);
      scr.rectb(18, 33, 124, 69, GOLD);
      big(scr, 58, 39, "DUEL", GOLD, 3);
      ctext(scr, 80, 63, "SAME COIN: SKR", WHITE);
      ctext(scr, 80, 72, `TO BEAT: ${str}`, WHITE);
      ctext(scr, 80, 88, "NO BETS. BEST TRADE WINS.", MIST);
      return;
    }
    scr.rect(26, 42, 108, 60, PAPER);
    scr.rectb(26, 42, 108, 60, INK);
    ctext(scr, 80, 49, "YOU SOLD", GREY);
    big(scr, Math.round(80 - (str.length * 12 - 3) / 2), 61, str, pct >= 0 ? GREEN : RED, 3);
    if (mf < MEME.sell + 22) ctext(scr, 80, 89, "A AGAIN  B COINS", GREY);
    else if (f % 16 < 11) ctext(scr, 80, 89, "UP: DARE A FRIEND", VIOLET);
  }
}

function box(lines: [string, number][], border: number): void {
  const w = Math.max(...lines.map(([l]) => l.length)) * 4 + 15;
  const h = lines.length * 9 + 9;
  const x = Math.floor((160 - w) / 2);
  const y = Math.floor((144 - h) / 2);
  scr.rect(x, y, w, h, INK);
  scr.rectb(x, y, w, h, border);
  lines.forEach(([l, col], i) => ctext(scr, 80, y + 6 + i * 9, l, col));
}

/** The save card between presses: says honestly whether the coin slot is loaded. */
function card(f: number): void {
  sea(f);
  scr.rect(0, 0, 160, 9, INK);
  scr.text(3, 2, "SAVE CARD", WHITE);
  sprite(scr, 62, 52 + Math.round(Math.sin(f / 8) * 2), 24, f, 3);
  const loaded = f >= T.coin1;
  if (loaded) ctext(scr, 80, 128, "WALLET CONNECTED", WHITE);
  else if (f % 24 < 16) ctext(scr, 80, 128, "CONNECT WALLET", WHITE);
  const i = PRESSES.findIndex((p) => f >= p && f < p + 20);
  if (i >= 0) {
    const landed = f >= PRESSES[i]! + PRESS_TRAVEL;
    const dots = ".".repeat(1 + (Math.floor(f / 4) % 3));
    // trades are approved in the player's wallet; the net moves on devnet are signed by the play key
    const trade = ACTIONS[i]!.busy === "BUYING" || ACTIONS[i]!.busy === "SELLING";
    box(landed ? [[ACTIONS[i]!.busy, WHITE], ["ON SOLANA", GREEN]] : [[ACTIONS[i]!.busy + dots, WHITE], [trade ? "APPROVE IN WALLET" : "PLAY KEY SIGNS", MIST]], landed ? GREEN : GOLD);
  }
}

function screen(f: number): void {
  if (f < T.boot) scr.cls(INK);
  else if (f < T.boot + 10) bootFlash((f - T.boot) / 10);
  else if (f < T.pressA + 6) title(f);
  else if (f < T.meme) round(Math.max(0, f - T.round), f);
  else if (f < T.pullEnd) meme(f - T.meme, f);
  else if (f < T.recap + 8) card(f);
  else title(f);
}

// ---- the handheld -------------------------------------------------------------------

function button(x: number, y: number, ch: string, down: boolean): void {
  const o = down ? 2 : 0;
  if (!down) con.circ(x, y + 2, 9, INK);
  con.circ(x, y + o, 9, down ? WHITE : MIST);
  if (!down) for (let i = -5; i <= 5; i++) con.pset(x + i, y - 9 + Math.round((i * i) / 9), WHITE);
  con.text(x - 1, y - 2 + o, ch, DEEP);
}

function drawConsole(f: number): void {
  const rf = f - T.round;
  const playing = f >= T.round && f < T.meme;
  const aDown = (f >= T.pressA && f < T.pressA + 5) || PRESSES.some((p) => f >= p && f < p + 5);
  const dir = playing ? steer(rf) : 0;

  con.cls(KEY);
  // lid
  rrect(con, CX, CY, 176, 160, VIOLET);
  con.rect(CX + 4, CY, 168, 1, LILAC);
  con.rect(CX + 2, CY + 1, 172, 1, LILAC);
  con.rect(CX, CY + 4, 1, 152, LILAC);
  con.rect(CX + 175, CY + 4, 1, 152, DEEP);
  con.rect(CX + 4, CY + 158, 168, 2, DEEP);
  con.rect(CX + 5, CY + 5, 166, 150, INK);
  con.blt(SCREEN.x, SCREEN.y, scr, 0, 0, 160, 144);
  if (f >= T.wallet) con.rect(CX, CY + 40, 2, 10, INK); // coin slot
  // hinge
  con.rect(CX + 14, CY + 160, 148, 6, DEEP);
  con.rect(CX + 2, CY + 160, 12, 6, LILAC);
  con.rect(CX + 162, CY + 160, 12, 6, LILAC);
  // base
  rrect(con, CX, CY + 166, 176, 84, VIOLET);
  con.rect(CX, CY + 170, 1, 76, LILAC);
  con.rect(CX + 175, CY + 170, 1, 76, DEEP);
  con.rect(CX + 4, CY + 248, 168, 2, DEEP);
  // Solana's mark and the wordmark, stamped into the plastic as on the web shell
  for (let i = 0; i < 3; i++) {
    con.rect(CX + 12, CY + 172 + i * 3, 7, 1, MIST);
    con.rect(CX + 11, CY + 173 + i * 3, 7, 1, MIST);
  }
  con.text(CX + 23, CY + 174, "SCRAPPY BOY", MIST);
  con.rect(CX + 163, CY + 174, 3, 3, f >= T.boot && f % 48 < 40 ? WHITE : DEEP);
  // d-pad
  rrect(con, CX + 10, CY + 188, 42, 42, DEEP, VIOLET);
  con.rect(CX + 26, CY + 193, 10, 32, MIST);
  con.rect(CX + 15, CY + 204, 32, 10, MIST);
  con.rect(CX + 26, CY + 193, 10, 1, WHITE);
  con.rect(CX + 15, CY + 204, 11, 1, WHITE);
  con.rect(CX + 36, CY + 204, 11, 1, WHITE);
  if (dir < 0) con.rect(CX + 26, CY + 193, 10, 11, WHITE);
  if (dir > 0) con.rect(CX + 26, CY + 214, 10, 11, WHITE);
  con.circ(CX + 31, CY + 209, 2, LILAC);
  // speaker, start / select
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) con.rect(CX + 76 + i * 6, CY + 194 + j * 6, 2, 2, DEEP);
  con.rect(CX + 70, CY + 228, 14, 3, MIST);
  con.rect(CX + 92, CY + 228, 14, 3, MIST);
  // A / B
  const ax = CX + 152, ay = CY + 201, bx = CX + 128, by = CY + 215;
  for (let t = 0; t <= 1; t += 0.1) con.circ(lerp(bx, ax, t), lerp(by, ay, t), 12, DEEP);
  button(bx, by, "B", false);
  button(ax, ay, "A", aDown);
}

/** Put the console on the frame. While it assembles, pixels arrive bottom-up in a scatter. */
function placeConsole(s: Image, p: number): void {
  for (let y = CY; y < CY + 250; y++)
    for (let x = CX; x < CX + 176; x++) {
      const c = con.data[y * W + x]!;
      if (c === KEY) continue;
      if (p < 1) {
        const h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        if ((h % 1000) / 1000 > p * 1.5 - (1 - (y - CY) / 250) * 0.5) continue;
      }
      s.data[y * W + x] = c;
    }
}

// ---- scene pieces drawn around the console ------------------------------------------

function wall(s: Image, f: number): void {
  const hard = f >= T.hard;
  const jolt = hard && f < T.hard + 8 ? (f % 2 ? 1 : -1) : 0;
  for (const t of TILES) {
    if (f < t.at) continue;
    const dt = f - t.fall;
    const y = t.y + (dt > 0 ? Math.floor(0.3 * dt * dt) : 0);
    if (y > H) continue;
    const x = t.x + jolt;
    const fresh = !hard && f - t.at < 2;
    if (fresh) {
      s.rect(x, y, t.w, 14, WHITE);
      continue;
    }
    s.rect(x, y, t.w, 14, t.solid ? (hard ? DEEP : VIOLET) : INK);
    s.rectb(x, y, t.w, 14, hard ? DEEP : VIOLET);
    s.text(x + 5, y + 4, t.word, t.solid ? (hard ? INK : WHITE) : hard ? DEEP : MIST);
  }
  const bh = bandHeight(f);
  if (bh > 0) {
    const y = BAND.mid - Math.floor(bh / 2);
    s.rect(0, y, W, bh, INK);
    s.rect(0, y, W, 1, VIOLET);
    s.rect(0, y + bh - 1, W, 1, VIOLET);
  }
}

/** The fallen pieces fly across and become the console. */
function pieces(s: Image, f: number): void {
  for (let i = 0; i < 170; i++) {
    const start = T.fall + 14 + Math.floor(rnd(i + 11) * (T.build1 - T.fall - 44));
    const t = (f - start) / 26;
    if (t < 0 || t > 1) continue;
    const e = eio(t);
    const x0 = rnd(i + 21) * 470, y0 = 150 + rnd(i + 31) * 120;
    const x1 = CX + 6 + rnd(i + 41) * 164, y1 = CY + 6 + rnd(i + 51) * 238;
    s.rect(lerp(x0, x1, e), lerp(y0, y1, e) - Math.sin(e * Math.PI) * 40, 2, 2, [VIOLET, LILAC, MIST][i % 3]!);
  }
}

const WALLET = { x: 26, y: 34 };
const SLOT = { x: CX - 1, y: CY + 45 };
const CHAIN = { x: 12, y: 196, w: 38, h: 24, pitch: 43 };

function mechanism(s: Image, f: number): void {
  // everything here lets go and drops when the recap begins
  const drop = f > T.recap ? Math.floor(0.4 * (f - T.recap) * (f - T.recap)) : 0;
  if (drop > H) return;

  // the wallet
  const wp = prog(f, T.wallet, T.wallet + 6);
  if (wp > 0) {
    const y = WALLET.y + drop + Math.round((1 - wp) * 6);
    rrect(s, WALLET.x, y, 46, 30, VIOLET, INK);
    s.rect(WALLET.x, y + 8, 46, 1, DEEP);
    s.rect(WALLET.x + 30, y + 12, 16, 9, DEEP);
    s.circ(WALLET.x + 36, y + 16, 2, GOLD);
    s.text(WALLET.x, y + 35, "YOUR WALLET", MIST);
  }
  // the path the coin takes, and the coin: the wallet's one signature
  const py0 = WALLET.y + 14 + drop;
  const path = prog(f, T.wallet + 4, T.coin0);
  for (let x = WALLET.x + 52; x < lerp(WALLET.x + 52, SLOT.x - 2, path); x += 4) s.rect(x, py0, 2, 1, LILAC);
  if (f >= T.coin0 && f < T.coin1) {
    const e = eio(prog(f, T.coin0, T.coin1));
    const x = Math.round(lerp(WALLET.x + 50, SLOT.x - 2, e));
    const y = py0 - Math.round(Math.sin(e * Math.PI) * 10);
    s.circ(x, y, 4, GOLD);
    s.circb(x, y, 4, ORANGE);
    s.rect(x - 1, y - 2, 1, 3, WHITE);
  }
  if (f >= T.coin0 + 6) ctext(s, (WALLET.x + 52 + SLOT.x) / 2, py0 - 20 + (drop ? drop : 0), "CONNECT", WHITE);
  if (f >= T.coin1 && f < T.coin1 + 6) s.rect(SLOT.x - 3, SLOT.y - 8, 4, 16, WHITE);

  // the chain: each press leaves the console as a pixel and lands as a block
  PRESSES.forEach((p, i) => {
    const bx = CHAIN.x + i * CHAIN.pitch;
    const by = CHAIN.y + drop + Math.floor(drop * rnd(i + 3) * 0.5);
    const land = p + PRESS_TRAVEL;
    if (f >= p + 2 && f < land) {
      const e = prog(f, p + 2, land);
      const x = Math.round(lerp(CX - 3, bx + CHAIN.w, e * e * (3 - 2 * e)));
      s.rect(x, CHAIN.y + 11, 3, 3, WHITE);
      for (let k = 1; k < 5; k++) s.pset(x + 3 + k * 3, CHAIN.y + 12, k < 3 ? LILAC : DEEP);
    }
    if (f < land) return;
    if (i > 0) s.rect(bx - 5, by + 11, 5, 2, LILAC);
    const flash = f - land < 3;
    s.rect(bx, by, CHAIN.w, CHAIN.h, flash ? WHITE : VIOLET);
    s.rectb(bx, by, CHAIN.w, CHAIN.h, flash ? WHITE : LILAC);
    if (flash) return;
    const lines = ACTIONS[i]!.block;
    lines.forEach((l, j) => ctext(s, bx + CHAIN.w / 2, by + (lines.length === 1 ? 9 : 5 + j * 8), l, WHITE));
  });
}

const WORDMARK = "SCRAPPY BOY";
function recap(s: Image, f: number): void {
  const n = Math.floor(prog(f, T.recap + 18, T.recap + 50) * WORDMARK.length + 0.001);
  if (n <= 0) return;
  const shown = WORDMARK.slice(0, n);
  big(s, 16 + 3, 70 + 3, shown, DEEP, 5);
  big(s, 16, 70, shown, WHITE, 5);
}

// ---- the frame ----------------------------------------------------------------------

export function renderFrame(f: number, s: Image): void {
  backdrop(s, f);
  if (f < T.fall + 60) wall(s, f);
  if (f >= T.fall && f < T.build1 + 4) pieces(s, f);
  if (f >= T.build0) {
    screen(f);
    drawConsole(f);
    placeConsole(s, prog(f, T.build0, T.build1));
  }
  if (f >= T.wallet) mechanism(s, f);
  if (f >= T.recap) recap(s, f);
}
