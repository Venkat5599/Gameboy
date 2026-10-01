"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";
import { useEffect, useRef, useState } from "react";
import { useWalletPicker } from "@/components/wallet/WalletPicker";
import { Console, type Input } from "@/lib/console";
import type { ScrappyBoy } from "@/lib/scrappyboy/game";
import type { SessionWallet } from "@/lib/scrappyboy/session";
import { Shell } from "./Shell";
import styles from "./handheld.module.css";

const explorer = (sig: string) =>
  sig.startsWith("main:") ? `https://solscan.io/tx/${sig.slice(5)}` : `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

/**
 * Share a run: the results screen scaled up crisp (nearest-neighbour) into a square card,
 * plus a challenge link that carries the score. Phone share sheet first, X as the fallback.
 */
async function shareRun(screen: HTMLCanvasElement, run: { score: number; best: number; creature: string; level: number; combo: number }, myName = "") {
  const url = `${window.location.origin}/scrappyboy?beat=${run.score}${myName ? `&vs=${encodeURIComponent(myName)}` : ""}`;
  const text = `I scored ${run.score} on SCRAPPY BOY riding the live SOL price with ${run.creature} (level ${run.level}, combo ${run.combo}). Beat me:`;
  const card = document.createElement("canvas");
  card.width = 1080;
  card.height = 1080;
  const g = card.getContext("2d")!;
  g.fillStyle = "#0e091c";
  g.fillRect(0, 0, 1080, 1080);
  g.imageSmoothingEnabled = false;
  const k = 6; // 160x144 -> 960x864
  g.drawImage(screen, (1080 - 160 * k) / 2, 40, 160 * k, 144 * k);
  g.fillStyle = "#e6fbf6";
  g.font = "600 40px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillText(`Beat ${run.score} at scrappypet.vercel.app/scrappyboy`, 540, 1010);
  const blob: Blob | null = await new Promise((r) => card.toBlob(r, "image/png"));
  const file = blob ? new File([blob], "scrappyboy-run.png", { type: "image/png" }) : null;
  try {
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: `${text} ${url}`, title: "SCRAPPY BOY" });
      return;
    }
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return; // the player closed the share sheet
    // share sheet unavailable or refused: fall through to X
  }
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener");
}

/**
 * Dare a friend: a link that opens MEME DASH on the same coin with this result as the one to beat.
 * It carries the sell signature so the friend can check the trade on the explorer. No stake rides on it.
 */
async function shareDuel(trade: { mint: string; symbol: string; pct: number; sig: string }, myKey: string, devnet: boolean) {
  const q = new URLSearchParams({ duel: trade.mint, pct: (trade.pct * 100).toFixed(2), by: myKey.slice(0, 4) });
  if (trade.sig) q.set("tx", trade.sig);
  if (devnet) q.set("net", "devnet");
  const url = `${window.location.origin}/scrappyboy?${q.toString()}`;
  const pct = `${trade.pct >= 0 ? "+" : ""}${(trade.pct * 100).toFixed(1)}%`;
  const text = `I got ${pct} on $${trade.symbol} in MEME DASH on SCRAPPY BOY. Same coin, your turn. No bets, best trade wins:`;
  try {
    if (navigator.share) {
      await navigator.share({ text: `${text} ${url}`, title: "SCRAPPY BOY duel" });
      return;
    }
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return; // the player closed the share sheet
  }
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener");
}

const TX_SIG = /^[1-9A-HJ-NP-Za-km-z]{64,90}$/;
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

/** Wait for a signature the wallet sent to confirm, by polling: no websocket needed. */
async function confirmSig(conn: Connection, sig: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const { value } = await conn.getSignatureStatuses([sig]);
    const s = value[0];
    if (s?.err) throw new Error("transaction failed on-chain");
    if (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized") return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("transaction not confirmed in 60 s");
}

/** A wallet's balance of one token, in raw units, across all its accounts for that mint. */
async function ownerTokens(conn: Connection, owner: PublicKey, mint: string): Promise<bigint> {
  const accs = await conn.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(mint) });
  return accs.value.reduce((sum, a) => sum + BigInt((a.account.data.parsed.info.tokenAmount as { amount: string }).amount), BigInt(0));
}

interface TxRow {
  label: string;
  sig: string;
}

export function Handheld() {
  const screenRef = useRef<HTMLDivElement>(null); // the shell's viewport hosts the canvases
  const conRef = useRef<Console | null>(null);
  const inputRef = useRef<Input | null>(null);
  const gameRef = useRef<ScrappyBoy | null>(null);
  const sessionRef = useRef<SessionWallet | null>(null);
  const duelRef = useRef(false); // a duel link was opened: go straight to MEME DASH once the wallet is wired
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [playKey, setPlayKey] = useState<string>();
  const [ready, setReady] = useState(false);
  const { publicKey, sendTransaction, disconnect } = useWallet();
  const picker = useWalletPicker();
  const pickerRef = useRef(picker);
  const disconnectRef = useRef(disconnect);
  useEffect(() => {
    pickerRef.current = picker;
    disconnectRef.current = disconnect;
  }, [picker, disconnect]);

  useEffect(() => {
    const host = screenRef.current;
    if (!host) return;
    let con: Console | null = null;
    let dead = false;
    let show: ReturnType<typeof setInterval> | undefined;
    // The Orca SDK ships wasm that must only load in the browser, so the game module is imported here.
    void Promise.all([import("@/lib/scrappyboy/game"), import("@/lib/scrappyboy/session"), import("@/lib/scrappyboy/meme")]).then(
      ([{ SCREEN_H, SCREEN_W, ScrappyBoy }, { SessionWallet }, { parseDuel }]) => {
        if (dead) return;
        con = new Console(host, { width: SCREEN_W, height: SCREEN_H, fps: 30 });
        conRef.current = con;
        inputRef.current = con.input;
        const session = SessionWallet.load();
        sessionRef.current = session;
        setPlayKey(session.address);
        const game = new ScrappyBoy(con, {
          onTx: (label, sig) => setTxs((t) => [{ label, sig }, ...t].slice(0, 8)),
          onConnect: () => pickerRef.current.open(),
          onEject: () => void disconnectRef.current(),
          onShare: (run) => void shareRun(con!.canvas, run, session.address),
        });
        const params = new URLSearchParams(window.location.search);
        const vs = params.get("vs");
        if (vs) {
          // ?vs=<friend's play key>: their best comes off the chain, not the URL.
          void import("@/lib/scrappyboy/arcade").then(async ({ readSaveCardFor }) => {
            const name = vs.slice(0, 4);
            try {
              const card = await readSaveCardFor(vs);
              game.setChallenge(card?.best ?? Number(params.get("beat")), name);
            } catch {
              game.setChallenge(Number(params.get("beat")), name);
            }
          });
        } else {
          game.setChallenge(Number(params.get("beat")), "");
        }
        // ?duel=<mint>&pct=<percent>&by=<name>: a friend's finished trade to beat on the same coin.
        const duel = parseDuel(params);
        if (duel) {
          game.meme.setDuel(duel);
          duelRef.current = true;
          const tx = params.get("tx");
          if (tx && TX_SIG.test(tx)) {
            const row = { label: `${duel.name}'s sell (the trade to beat)`, sig: params.get("net") === "devnet" ? tx : `main:${tx}` };
            setTxs((t) => [...t, row]);
          }
        }
        gameRef.current = game;
        con.run({ update: () => game.update(), draw: () => game.draw() });
        // MEME DASH draws to its own canvas, stacked on top of the game canvas in the viewport.
        host.appendChild(game.meme.canvas);
        show = setInterval(() => {
          game.meme.canvas.style.display = game.meme.active ? "block" : "none";
        }, 150);
        setReady(true);
      },
    );
    return () => {
      dead = true;
      if (show) clearInterval(show);
      con?.destroy();
      conRef.current = null;
      gameRef.current = null;
      sessionRef.current = null;
    };
  }, []);

  // The play key signs every game move on-device, so nothing pops a wallet mid-play.
  useEffect(() => {
    if (!ready) return;
    const session = sessionRef.current;
    if (!session) return;
    void session.kitSigner().then((s) => gameRef.current?.setSigner(s));
  }, [ready]);

  // MEME DASH runs on the play key too. The connected wallet only shows up to feed the coin slot.
  useEffect(() => {
    if (!ready) return;
    const session = sessionRef.current;
    if (!session) return;
    // ?net=devnet turns the demo free: swaps go through the Orca devnet pool.
    const devnet = new URLSearchParams(window.location.search).get("net") === "devnet";
    // Same-origin RPC proxy: the public mainnet endpoint 403s browser origins.
    const conn = devnet ? new Connection("https://api.devnet.solana.com") : new Connection(`${window.location.origin}/api/rpc`);
    // SEEKER badge on the save card when the play key holds any SKR.
    const bank = publicKey && sendTransaction ? { key: publicKey, send: sendTransaction } : null;
    // On mainnet a connected wallet trades for itself: it signs every buy and sell and keeps the coins.
    // The play key is left for the free devnet cartridges, where nothing it holds is worth anything.
    const direct = !devnet && !!bank;
    if (!devnet) {
      void (bank ? ownerTokens(conn, bank.key, SKR_MINT) : session.tokenBalance(conn, SKR_MINT))
        .then((b) => gameRef.current?.setSeeker(b > BigInt(0)))
        .catch(() => {});
    }
    gameRef.current?.setMemeWallet({
      address: direct ? bank!.key.toBase58() : session.address,
      devnet,
      direct,
      send: direct
        ? async (b64) => {
            const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
            const sig = await bank!.send(tx, conn);
            await confirmSig(conn, sig);
            return sig;
          }
        : (b64) => session.send(conn, b64),
      tokenBalance: direct ? (mint) => ownerTokens(conn, bank!.key, mint) : (mint) => session.tokenBalance(conn, mint),
      solBalance: direct ? async () => BigInt(await conn.getBalance(bank!.key)) : () => session.solBalance(conn),
      devSwap: devnet
        ? async (mint, amount) => {
            const { devSwap, SOL_MINT, DEV_USDC_MINT } = await import("@/lib/scrappyboy/chain");
            const { address } = await import("@solana/kit");
            const s = await session.kitSigner();
            const input = mint === SOL_MINT ? SOL_MINT : mint === DEV_USDC_MINT ? DEV_USDC_MINT : address(mint);
            return devSwap(s, input, amount);
          }
        : undefined,
      // Insert coin: the only signature the player's wallet ever does, one transfer into the play key.
      topUp: bank && !direct
        ? async (lamports) => {
            const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: bank.key, toPubkey: session.keypair.publicKey, lamports }));
            tx.feePayer = bank.key;
            tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
            return bank.send(tx, conn);
          }
        : undefined,
      // Cash out: the play key sweeps everything back to the player's wallet, no popup needed.
      sweep: bank ? () => session.sweep(conn, bank.key) : undefined,
      connect: () => pickerRef.current.open(),
      onTx: (label, sig) => setTxs((t) => [{ label, sig: devnet ? sig : `main:${sig}` }, ...t].slice(0, 8)),
      shareDuel: (trade) => void shareDuel(trade, session.address, devnet),
    });
    if (duelRef.current) {
      duelRef.current = false;
      gameRef.current?.meme.open();
    }
  }, [ready, publicKey, sendTransaction]);

  // Mainnet with a wallet connected: that wallet signs its own trades (see the MEME DASH wiring above).
  const tradingFromWallet = ready && !!publicKey && new URLSearchParams(window.location.search).get("net") !== "devnet";

  return (
    <main className={styles.room}>
      <Shell input={inputRef} wordmark="SCRAPPY BOY">
        <div ref={screenRef} />
      </Shell>

      <section className={styles.log} aria-live="polite">
        {tradingFromWallet && publicKey ? (
          <p className={styles.slot2}>
            Trading from your wallet{" "}
            <a href={`https://solscan.io/account/${publicKey.toBase58()}`} target="_blank" rel="noreferrer">
              {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
            </a>
            . You approve every trade there, and the coins stay in it.
          </p>
        ) : (
          playKey && (
            <p className={styles.slot2}>
              Playing as{" "}
              <a href={`https://explorer.solana.com/address/${playKey}?cluster=devnet`} target="_blank" rel="noreferrer">
                {playKey.slice(0, 4)}…{playKey.slice(-4)}
              </a>
              , this device&apos;s play key. Every move below signed on-device: no popups.
            </p>
          )
        )}
        {txs.map((t) => (
          <a key={t.sig} className={styles.tx} href={explorer(t.sig)} target="_blank" rel="noreferrer">
            <span>{t.label}</span>
            <span className={styles.sig}>{t.sig.replace("main:", "").slice(0, 8)}…</span>
          </a>
        ))}
      </section>
    </main>
  );
}
