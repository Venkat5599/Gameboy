import { NextResponse } from "next/server";

/**
 * Coin-icon proxy: token art hosts don't send CORS headers, so the canvas can't read them directly.
 * Token art lives on many hosts, so instead of a host list this refuses anything that is not a
 * public https address, follows at most a few redirects (checking each hop), caps the size, and
 * serves the bytes in a sandbox so an SVG can never run script on our origin.
 */
const MAX_BYTES = 2_000_000;
const MAX_HOPS = 3;

/** Public https only: no localhost, no private or link-local ranges, no internal names. */
function publicHttps(u: URL): boolean {
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return false;
  if (h.startsWith("[")) return false; // IPv6 literals: token art never needs them
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split(".").map(Number) as [number, number];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 100 && b >= 64 && b <= 127)) return false;
  }
  return true;
}

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u");
  if (!u) return NextResponse.json({ error: "missing u" }, { status: 400 });
  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  try {
    let r: Response | null = null;
    for (let hop = 0; hop <= MAX_HOPS; hop++) {
      if (!publicHttps(target)) return NextResponse.json({ error: "public https only" }, { status: 400 });
      r = await fetch(target, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(6_000) });
      if (r.status < 300 || r.status >= 400) break;
      const next = r.headers.get("location");
      if (!next || hop === MAX_HOPS) return NextResponse.json({ error: "too many redirects" }, { status: 502 });
      target = new URL(next, target);
    }
    if (!r || !r.ok) return NextResponse.json({ error: `upstream ${r?.status ?? 0}` }, { status: 502 });
    const type = r.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return NextResponse.json({ error: "not an image" }, { status: 415 });
    if (Number(r.headers.get("content-length") ?? 0) > MAX_BYTES) return NextResponse.json({ error: "image too large" }, { status: 413 });
    const bytes = await r.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return NextResponse.json({ error: "image too large" }, { status: 413 });
    return new NextResponse(bytes, {
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=86400",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
