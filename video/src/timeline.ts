// One timeline for picture and sound, in frames at 24 fps. Scenes and the soundtrack both read it,
// so a sound can never drift from the thing on screen that makes it.

export const FPS = 24;
export const DURATION = 1176; // 49 s

export const T = {
  hard: 104, // the jargon wall stops; "Crypto is hard."
  fall: 144, // the wall falls
  build0: 172, // console assembles from the pieces
  build1: 252,
  boot: 262,
  pressA: 322,
  round: 336, // camera pushes into the screen, the round starts
  pushEnd: 362,
  meme: 504, // cartridge two: MEME DASH, still on the console's screen
  pull: 792, // camera pulls back
  pullEnd: 818,
  wallet: 820,
  coin0: 834, // the wallet connects: a coin travels from it to the console
  coin1: 872,
  recap: 1032,
};

/** Round frames (relative to T.round) when a pearl reaches the creature. */
export const PEARLS = [36, 62, 88, 112, 134, 156];
export const GOLD_PEARL = 4;

/** MEME DASH beats, in frames after T.meme: A picks the coin, A buys, B sells, UP dares a friend (the trade duel). */
export const MEME = { pick: 40, buy: 76, sell: 150, duel: 196 };

/** A-button presses in the mechanism scene; each one lands as a block. */
export const PRESSES = [888, 910, 932, 954, 976, 998];
export const PRESS_TRAVEL = 14;

/** Labels are the game's own: the tx log rows and the busy boxes in game.ts / meme.ts. */
export const ACTIONS: { block: string[]; busy: string }[] = [
  { block: ["CAST", "NET"], busy: "CASTING YOUR NET" },
  { block: ["COLLECT", "COINS"], busy: "COLLECTING COINS" },
  { block: ["BUY"], busy: "BUYING" },
  { block: ["SELL"], busy: "SELLING" },
  { block: ["RECENTRE"], busy: "RECENTRING THE NET" },
  { block: ["CASH", "OUT"], busy: "CASHING OUT" },
];

/** Deterministic noise: the film must render the same frame every time. */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Terms a new user meets in Solana apps, taken as they appear in wallets and DeFi screens.
const WORDS = [
  "SLIPPAGE", "SEED PHRASE", "TICK RANGE", "PRIORITY FEE", "LIMIT ORDER", "GAS", "RPC", "APPROVE", "IMPERMANENT LOSS",
  "LP TOKEN", "BRIDGE", "ROUTE", "SIGN MESSAGE", "MAX", "SWAP", "STAKE", "UNSTAKE", "REVOKE", "NONCE", "ATA", "WRAP SOL",
  "FEE TIER", "MIN RECEIVED", "PRICE IMPACT", "CONFIRM", "DERIVATION PATH", "PUBKEY", "HEALTH FACTOR", "LEVERAGE", "ORACLE",
  "SLOT", "EPOCH", "COMPUTE UNITS", "RENT", "MEMO", "BLOCKHASH EXPIRED", "RETRY", "CUSTOM RPC", "ADVANCED", "EXPERT MODE",
];

export interface Tile {
  x: number;
  y: number;
  w: number;
  word: string;
  at: number; // frame it appears
  fall: number; // frame it lets go
  solid: boolean;
}

export const WORLD_W = 640;
export const VIEW_W = 480;

/** The wall of jargon: rows of tiles that arrive slowly, then faster than anyone can read. */
export const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  let k = 0;
  for (let row = 0; row < 14; row++) {
    let x = -Math.floor(rnd(row + 1) * 24);
    const y = row * 20 - 5;
    while (x < WORLD_W) {
      const word = WORDS[k % WORDS.length]!;
      const w = word.length * 4 + 10;
      out.push({ x, y, w, word, at: 0, fall: 0, solid: k % 5 === 2 });
      x += w + 5;
      k++;
    }
  }
  const order = out.map((_, i) => i).sort((a, b) => rnd(a * 3.3 + 7) - rnd(b * 3.3 + 7));
  order.forEach((ti, n) => {
    const t = out[ti]!;
    t.at = 4 + Math.floor(98 * Math.sqrt(n / order.length));
    t.fall = T.fall + Math.floor(rnd(ti + 99) * 22);
  });
  return out;
})();
