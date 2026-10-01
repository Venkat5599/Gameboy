import { NextResponse } from "next/server";

/**
 * Same-origin JSON-RPC proxy for MEME DASH mainnet calls.
 * api.mainnet-beta.solana.com 403s browser origins, so balance polls and swap sends ride
 * through here instead. It is not a general RPC: only the methods the game and a wallet
 * adapter need are forwarded, and each address gets a per-minute budget.
 */
const UPSTREAM = process.env.SCRAPPY_RPC_MAINNET ?? "https://api.mainnet-beta.solana.com";

const ALLOWED = new Set([
  // the game: balances, sending a swap, waiting for it
  "getBalance",
  "getTokenAccountsByOwner",
  "getLatestBlockhash",
  "sendTransaction",
  "getSignatureStatuses",
  // what wallet adapters ask for around signing a versioned transaction
  "getAccountInfo",
  "getMultipleAccounts",
  "simulateTransaction",
  "getBlockHeight",
  "isBlockhashValid",
  "getFeeForMessage",
  "getMinimumBalanceForRentExemption",
]);

const MAX_BODY = 64 * 1024;
const MAX_BATCH = 10;
const PER_MINUTE = 240;

// Best effort: each server instance keeps its own counters, so this slows abuse rather than capping it exactly.
const hits = new Map<string, { n: number; start: number }>();
function limited(ip: string, now = Date.now()): boolean {
  const h = hits.get(ip);
  if (!h || now - h.start >= 60_000) {
    if (hits.size > 20_000) hits.clear();
    hits.set(ip, { n: 1, start: now });
    return false;
  }
  h.n += 1;
  return h.n > PER_MINUTE;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "rate limited" }, { status: 429, headers: { "retry-after": "60" } });

  const text = await req.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "too large" }, { status: 413 });
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "not json" }, { status: 400 });
  }
  const calls = Array.isArray(parsed) ? parsed : [parsed];
  if (calls.length === 0 || calls.length > MAX_BATCH) return NextResponse.json({ error: "bad batch" }, { status: 400 });
  const blocked = calls.find((c) => typeof (c as { method?: unknown })?.method !== "string" || !ALLOWED.has((c as { method: string }).method));
  if (blocked) return NextResponse.json({ error: "method not allowed" }, { status: 403 });

  try {
    const r = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: text,
      cache: "no-store",
    });
    return new NextResponse(r.body, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" } });
  } catch (e) {
    return NextResponse.json({ error: `rpc upstream failed: ${(e as Error).message}` }, { status: 502 });
  }
}
