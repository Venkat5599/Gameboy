import { type CSSProperties, type ReactNode, useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { DEFAULT_PALETTE } from "./engine/consts";
import { Image } from "./engine/image";
import { BAND, bandHeight, H, renderFrame, SCREEN, W } from "./scenes";
import { MEME, T } from "./timeline";

const K = 4; // one world pixel is 4 screen pixels at rest, 6 when the camera is on the console's screen
const img = new Image(W, H);
const RGBA = new Uint32Array(DEFAULT_PALETTE.map((c) => 0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >> 16) & 0xff)));

const fonts = delayRender("fonts");
void Promise.all(
  (
    [
      ["Pally", "pally-700.woff2", "700"],
      ["Switzer", "switzer-500.woff2", "500"],
      ["Switzer", "switzer-600.woff2", "600"],
    ] as const
  ).map(([family, file, weight]) => new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight }).load().then((face) => document.fonts.add(face))),
).then(() => continueRender(fonts));

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const INK = "#0e091c";
const MIST = "#c4bbfd";
const LILAC = "#9b87ff";
const display: CSSProperties = { fontFamily: "Pally, system-ui, sans-serif", fontWeight: 700, color: "#fff", lineHeight: 1.04, letterSpacing: "-0.01em" };
const body: CSSProperties = { fontFamily: "Switzer, system-ui, sans-serif", fontWeight: 500, color: MIST };

/** Words arrive one at a time and settle in three steps, like the pixels do. Nothing ever fades in. */
function Words({ lines, from, to, step = 3 }: { lines: string[]; from: number; to: number; step?: number }) {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  let n = 0;
  return (
    <>
      {lines.map((line) => (
        <div key={line} style={{ whiteSpace: "nowrap" }}>
          {line.split(" ").map((word) => {
            const age = f - (from + n++ * step);
            const out = to - f;
            const y = age < 0 ? 0 : age === 0 ? 28 : age === 1 ? 10 : out <= 2 ? -14 * (3 - out) : 0;
            return (
              <span key={n} style={{ display: "inline-block", marginRight: "0.26em", transform: `translateY(${y}px)`, visibility: age < 0 ? "hidden" : "visible" }}>
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
}

function Block({ top, left = 64, size, children, style }: { top: number; left?: number; size: number; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", top, left, fontSize: size, ...display, ...style }}>{children}</div>;
}

/** Solana's mark, the same three bars the shell carries. */
function SolMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ flex: "none" }}>
      <path d="M14 30l12-12h60l-12 12z" fill={MIST} />
      <path d="M14 56l12-12h60l-12 12z" fill={MIST} />
      <path d="M14 82l12-12h60l-12 12z" fill={MIST} />
    </svg>
  );
}

export function Film() {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    renderFrame(f, img);
    const frame = ctx.createImageData(W, H);
    const out = new Uint32Array(frame.data.buffer);
    for (let i = 0; i < img.data.length; i++) out[i] = RGBA[img.data[i]!]!;
    ctx.putImageData(frame, 0, 0);
  }, [f]);

  // Camera: push into the console's screen for the round, pull back for the mechanism.
  const p = eio(Math.min(prog(f, T.round, T.pushEnd), 1 - prog(f, T.pull, T.pullEnd)));
  const scale = 1 + 0.5 * p;
  const sx = (SCREEN.x + SCREEN.w / 2) * K;
  const sy = (SCREEN.y + SCREEN.h / 2) * K;
  const tx = lerp(sx, 960, p) - scale * sx;
  const ty = lerp(sy, 472, p) - scale * sy;

  const bh = bandHeight(f) * K;
  const bar = Math.round(176 * (1 - Math.min(prog(f, T.round + 14, T.round + 24), 1 - prog(f, T.pull + 4, T.pull + 14))));

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: W * K, height: H * K, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
        <canvas ref={ref} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W * K, height: H * K, imageRendering: "pixelated" }} />

        {/* 1. the hook, set inside the band the wall opens for it */}
        {bh > 0 && (
          <div style={{ position: "absolute", left: 0, width: 1920, top: BAND.mid * K - bh / 2, height: bh, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, width: 1920, top: bh / 2 - (BAND.full * K) / 2, height: BAND.full * K, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 176, ...display }}>
              Crypto is hard.
            </div>
          </div>
        )}

        {/* 2. the turn */}
        <Block top={372} size={128}>
          <Words lines={["So we made", "it a game."]} from={T.build0 + 24} to={T.pushEnd} />
        </Block>

        {/* 4. the mechanism */}
        <Block top={372} size={104}>
          <Words lines={["Connect your", "wallet to trade."]} from={T.coin0 + 4} to={T.coin1 + 10} />
        </Block>
        <Block top={352} size={104}>
          <Words lines={["Then every press", "lands on Solana."]} from={T.coin1 + 12} to={T.recap} />
        </Block>
        {f >= T.coin1 + 34 && f < T.recap && <div style={{ position: "absolute", top: 596, left: 68, width: 900, fontSize: 34, lineHeight: 1.3, ...body }}>Free play needs no wallet. Trades are approved in your own wallet.</div>}

        {/* 5. the recap, under the pixel wordmark */}
        <Block top={468} size={62}>
          <Words lines={["Every button is a Solana action."]} from={T.recap + 54} to={9999} />
        </Block>
        {f >= T.recap + 76 && <div style={{ position: "absolute", top: 580, left: 66, fontSize: 42, ...body, fontWeight: 600, color: "#fff" }}>scrappypet.vercel.app/scrappyboy</div>}
        {f >= T.recap + 90 && (
          <div style={{ position: "absolute", top: 672, left: 66, display: "flex", alignItems: "center", gap: 18, fontSize: 34, ...body, color: LILAC }}>
            <SolMark size={44} />
            <span>Built for Solana Mobile and Seeker</span>
          </div>
        )}
      </div>

      {/* 3. the round: the game's own ink bar slides up to carry the line */}
      {bar < 176 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -bar, height: 176, background: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontSize: 66, ...display }}>
            <Words lines={["That line is the SOL price."]} from={T.round + 22} to={T.round + 96} />
            <Words lines={["Keep it inside your net."]} from={T.round + 100} to={T.meme} />
            <Words lines={["Same buttons trade meme coins."]} from={T.meme + 8} to={T.meme + MEME.buy - 6} />
            <Words lines={["A buys. B sells. Each one is a Jupiter swap."]} from={T.meme + MEME.buy - 2} to={T.meme + MEME.duel - 6} />
            <Words lines={["Then dare a friend to beat your trade."]} from={T.meme + MEME.duel - 2} to={T.pull + 6} />
          </div>
          <div style={{ fontSize: 22, ...body, color: "#8f86b3" }}>
            {f < T.meme ? "SOL-USD one-minute closes from Coinbase, replayed fast." : "SKR-USD one-minute candles from GeckoTerminal, replayed fast. Trading can lose money."}
          </div>
        </div>
      )}

      <Audio src={staticFile("score.wav")} />
    </AbsoluteFill>
  );
}
