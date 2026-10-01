import { Critter, SeaCast } from "@/components/SeaCast";
import { LandingNav } from "@/components/LandingNav";
import { GlossButton } from "@/components/GlossButton";
import { HeroClouds } from "@/components/backgrounds/HeroClouds";
import { AgentOrbClient } from "@/components/AgentOrbClient";

const REPO_URL = "https://github.com/Venkat5599/solana_coloseum";

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
      <path d="M4.5 11.5l7-7M6 4.5h5.5V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <GlossButton href={href}>
      {children}
      <Arrow />
    </GlossButton>
  );
}

export default function Home() {
  return (
    <main>
      <LandingNav />
      {/* HERO: owns the first screen */}
      <section className="grain relative flex min-h-[100svh] flex-col overflow-hidden px-4 pt-20 sm:px-8">
        <HeroClouds />


        <SeaCast />
        <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center pb-20 pt-6 text-center">
          <h1 className="font-display text-balance text-[clamp(2.5rem,6vw,4.9rem)] font-bold leading-[1.04] tracking-[-0.01em]">
            Crypto is hard.
            <span className="block text-white [text-shadow:0_2px_14px_rgba(15,50,90,0.45)]">So we made it a game.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[18px] font-semibold leading-relaxed text-navy-text">
            A pocket arcade where the buttons do your Solana trades. Play free. Connect a wallet when you want to trade.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <PrimaryLink href="/scrappyboy?net=devnet">Play SCRAPPY BOY</PrimaryLink>
            <GlossButton href="/scrappy.apk" download>
              Get the Android app
              <Arrow />
            </GlossButton>
            <span className="-mt-1 text-[13px] font-semibold text-navy-text">APK · 1 MB</span>
            <span className="text-[14px] font-semibold text-navy-text">Free to play. No wallet needed until you trade.</span>
          </div>
          <figure className="mt-10 w-full max-w-md rounded-2xl bg-ground-deep px-5 py-4 text-left shadow-[0_6px_16px_-8px_rgba(29,29,31,0.5)]">
            <figcaption className="text-[12px] text-ink-faint">How a round goes</figcaption>
            <p className="mt-1.5 text-[15px] leading-snug">Your creature rides the live SOL price</p>
            <p className="mt-2 text-[17px] leading-snug text-ink">Steer the net. Catch pearls. Dodge jellyfish.</p>
            <p className="mt-3 text-[13px] text-ink-soft">Combos up to x8 · levels speed up · WHALE WAVE on big moves</p>
          </figure>
          <div className="mt-3 flex w-full max-w-md items-end gap-3 text-left">
            <Critter who="finn" className="hero-pet w-20 shrink-0" title="Finn the fish" />
            <p className="relative mb-6 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[15px] font-semibold leading-snug text-navy-text shadow-[0_4px_12px_-8px_rgba(29,29,31,0.45)]">
              Psst! Keeping the price in your net is exactly what liquidity providers do. You just learned it.
            </p>
          </div>
        </div>
      </section>

      {/* THE FILM: the whole idea in 49 seconds. The island is the film's own ink, so the frame has no visible edge. */}
      <section id="film" className="scroll-mt-6 px-3 pt-16 sm:px-6 sm:pt-24">
        <figure className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[#0e091c]">
          <video
            className="block aspect-video w-full"
            controls
            playsInline
            preload="none"
            poster="/scrappy-boy-poster.png"
            aria-label="SCRAPPY BOY in 49 seconds: the jargon wall falls, the handheld boots, a round on the SOL price, a MEME DASH trade, a duel with a friend"
          >
            <source src="/scrappy-boy.mp4" type="video/mp4" />
          </video>
          <figcaption className="px-6 py-4 text-[14px] font-semibold text-on-night-soft sm:px-8">
            SCRAPPY BOY in 49 seconds. Turn the sound on: the music is played by the console&rsquo;s own chip.
          </figcaption>
        </figure>
      </section>

      {/* FOUR BUTTONS: jargon wall vs what we actually ask of you */}
      <section className="px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display tracking-[-0.005em] max-w-3xl text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.015em]">
            Trading apps hand you a textbook of words. We have four buttons.
          </h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <figure className="relative overflow-hidden rounded-3xl bg-white p-7 ring-1 ring-edge">
              <figcaption className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-faint">a normal trading app</figcaption>
              <p className="mt-4 select-none font-mono text-[13px] leading-[1.9] text-ink-faint">
                {[
                  "slippage tolerance", "order book", "limit order", "gas fee", "seed phrase",
                  "approve token", "sign message", "market depth", "TVL", "impermanent loss",
                  "bridge asset", "RPC endpoint", "nonce", "funding rate", "liquidation",
                  "margin call", "MEV", "spread", "KYC", "cold wallet",
                ].map((w) => (
                  <span key={w} className="mr-3 inline-block">
                    {w}
                  </span>
                ))}
              </p>
              <p className="mt-5 text-[14px] font-semibold text-ink-soft">
                Most people close the tab before they ever buy anything. We hid all of it inside the cartridge.
              </p>
            </figure>
            <figure className="rounded-3xl bg-ground-deep p-7">
              <figcaption className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-faint">scrappy boy</figcaption>
              <ul className="mt-4 space-y-3 text-[15px] font-semibold text-ink">
                {[
                  ["◀ ▶", "pick a coin"],
                  ["A", "buy"],
                  ["B", "sell"],
                  ["▲", "dare a friend to beat your trade"],
                ].map(([k, d]) => (
                  <li key={k} className="flex items-center gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#6e54ff] font-display text-[13px] font-bold text-white shadow-[0_3px_0_rgba(58,42,158,0.55)]">
                      {k}
                    </span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[14px] font-semibold text-ink-soft">That is the whole interface. Your wallet approves each trade.</p>
            </figure>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: play, cast, collect */}
      <section id="how" className="px-4 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display tracking-[-0.005em] text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.015em]">
            Play first. Then play for keeps.
          </h2>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-soft">
            There is no practice mode and no manual. The game is the interface: press a button and the trade happens.
          </p>
          <div className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-6">
            {[
              { who: "finn" as const, bg: "bg-white", t: "Play", d: "An endless round riding the live SOL price. Keep your creature in the net, stack combos, chase the day's best." },
              { who: "shelly" as const, bg: "bg-white", t: "Cast a net", d: "Pick a spot on the sea map and press A. The net is your money, parked where other people trade." },
              { who: "zip" as const, bg: "bg-white", t: "Collect", d: "Every trade that swims through your net pays you a little. Press A and it drops into your purse." },
            ].map((s) => (
              <div key={s.t} className={`rounded-3xl p-6 pb-8 ${s.bg}`}>
                <Critter who={s.who} className="mx-auto w-40" title={s.who} />
                <h3 className="mt-4 font-display tracking-[-0.005em] text-2xl font-bold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE STAKES: inset night island */}
      <section id="stakes" className="px-3 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[28px] bg-night px-6 py-16 text-on-night sm:px-12 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 className="font-display tracking-[-0.005em] text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.015em]">
              Every number comes from the chain.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-on-night-soft">
              The chart is the live SOL price. A net is your money parked where trades happen. Coins are the small
              cut those trades pay you. Every move links to the public record on Solana. And points are just points:
              the game never turns your score into a bet.
            </p>
          </div>
          <figure className="mx-auto w-full max-w-sm rounded-2xl bg-night-raise p-6 ring-1 ring-white/5">
            <figcaption className="text-[12px] text-on-night-soft">After a run</figcaption>
            <Critter who="shelly" frame={1} className="hero-pet mx-auto mt-2 w-36" title="Shelly the turtle" />
            <p className="mt-3 text-center font-display tracking-[-0.005em] text-2xl">Score · best combo · pearls</p>
            <p className="mt-1 text-center text-[14px] text-on-night-soft">How long the price stayed in your net, then one tap to cast a net with money</p>
          </figure>
        </div>
      </section>

      {/* PLAY WITH FRIENDS */}
      <section id="ai-teams" className="scroll-mt-6 px-3 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 rounded-[28px] bg-white px-6 py-14 sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:items-center [&>*]:min-w-0">
          <div>
            <AgentOrbClient size={112} tone="light" className="-ml-3 mb-4" />
            <h2 className="font-display tracking-[-0.005em] text-[clamp(2rem,3.4vw,2.7rem)] font-bold leading-[1.06] tracking-[-0.015em]">
              Beat your friends&rsquo;<br className="hidden sm:block" /> best score.
            </h2>
            <dl className="mt-8 space-y-5 text-[15px]">
              <div>
                <dt className="font-bold">Challenge links</dt>
                <dd className="mt-1 text-ink-soft">Share your run as a card. Friends who open it see your score to beat, live in their round.</dd>
              </div>
              <div>
                <dt className="font-bold">Trade duels</dt>
                <dd className="mt-1 text-ink-soft">Finish a MEME DASH trade and dare a friend to beat it on the same coin. Everyone trades their own money. No bets, best trade wins.</dd>
              </div>
              <div>
                <dt className="font-bold">A handheld in your pocket</dt>
                <dd className="mt-1 text-ink-soft">Runs on the web and as a 1 MB Android app for Solana Seeker. D-pad, A, B, done.</dd>
              </div>
              <div>
                <dt className="font-bold">Two cartridges in the box</dt>
                <dd className="mt-1 text-ink-soft">The fishing net is secretly money parked in a pool. MEME DASH is secretly buying meme coins. Neither screen uses those words.</dd>
              </div>
            </dl>
            <div className="mt-9">
              <PrimaryLink href="/scrappyboy?net=devnet">Start a round</PrimaryLink>
            </div>
          </div>

          <pre style={{ fontVariantLigatures: "none", fontWeight: 400 }} className="overflow-x-auto rounded-2xl bg-ground-deep p-6 font-mono text-[13px] leading-relaxed text-ink ring-1 ring-edge">
{`What each button does

  A  cast net    put money in the pool
  A  collect     take the coins it earned
  B  recentre    move the net to the price
  B  pull in     take your money back out
  A  buy coin    an actual coin, on Solana

Trades are approved in your own wallet.`}
          </pre>
        </div>
      </section>

      <footer className="bg-ground-deep px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center text-[14px] text-ink-soft">
          <p>
            <span className="font-display tracking-[-0.005em] text-[18px] text-ink">scrappypet</span> · home of SCRAPPY BOY · built on Solana
          </p>
          <p className="flex gap-5">
            <a href={REPO_URL} className="transition-colors hover:text-ink">Source on GitHub</a>
            <a href="/privacy" className="transition-colors hover:text-ink">Privacy and keys</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
