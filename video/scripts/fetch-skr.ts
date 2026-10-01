// Pulls SKR-USD one-minute candles from GeckoTerminal, the same source MEME DASH charts from.
// Every candle in the MEME DASH scene comes from this file. Usage: bun scripts/fetch-skr.ts
const SKR = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3"; // same mint as SKR_MINT in meme.ts
const API = "https://api.geckoterminal.com/api/v2/networks/solana";
const get = async <T>(url: string): Promise<T> => {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return (await r.json()) as T;
};

const pools = await get<{ data: { attributes: { address: string; name: string } }[] }>(`${API}/tokens/${SKR}/pools?page=1`);
const pool = pools.data[0]?.attributes;
if (!pool) throw new Error("no pool found for SKR");
const r = await get<{ data: { attributes: { ohlcv_list: number[][] } } }>(`${API}/pools/${pool.address}/ohlcv/minute?aggregate=1&limit=90&token=${SKR}`);
// rows: [time, open, high, low, close, volume], newest first
const candles = r.data.attributes.ohlcv_list.map(([, o, h, l, c]) => ({ o: o!, h: h!, l: l!, c: c! })).reverse();
if (candles.length < 60) throw new Error(`only ${candles.length} candles returned`);
await Bun.write(new URL("../src/data/skr.json", import.meta.url), JSON.stringify({ source: "GeckoTerminal SKR-USD, 1-minute candles", pool: pool.address, poolName: pool.name, candles }));
console.log(`${candles.length} candles from ${pool.name} (${pool.address}), ${candles[0]!.c} -> ${candles[candles.length - 1]!.c}`);
