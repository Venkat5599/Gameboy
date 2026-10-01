// Pulls SOL-USD one-minute closes from Coinbase's public market data (the same feed the game uses).
// The film replays these; every price on screen comes from this file. Usage: bun scripts/fetch-prices.ts
const res = await fetch("https://api.exchange.coinbase.com/products/SOL-USD/candles?granularity=60", {
  headers: { "user-agent": "scrappy-video" },
});
if (!res.ok) throw new Error(`price feed ${res.status}`);
// Coinbase rows: [time, low, high, open, close, volume], newest first.
const rows = (await res.json()) as [number, number, number, number, number, number][];
const closes = rows
  .slice(0, 120)
  .map(([t, , , , c]) => ({ t, c }))
  .reverse();
if (closes.length < 70) throw new Error(`only ${closes.length} candles returned`);
const out = { source: "Coinbase SOL-USD, 1-minute closes", recordedAt: new Date().toISOString(), closes };
await Bun.write(new URL("../src/data/sol.json", import.meta.url), JSON.stringify(out));
console.log(`${closes.length} closes, ${closes[0]!.c} -> ${closes[closes.length - 1]!.c}`);
