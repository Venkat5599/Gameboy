import { Swimmer } from "@/components/SeaCast";
import { KeyMap } from "@/components/KeyMap";
import { Rise } from "@/components/LandingMotion";

/**
 * Play with friends, staged as the console's versus screen: two of the cast squaring up over the same coin.
 * No scores are shown here; the numbers only ever come from a run or a trade.
 */
export function FriendsSection({ cta }: { cta: React.ReactNode }) {
  return (
    <section id="friends" className="scroll-mt-6 px-3 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl rounded-[28px] bg-white px-5 py-12 sm:px-12 sm:py-14">
        <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.015em]">Beat your friends&rsquo; best score.</h2>

        <Rise from={40} className="mt-9 rounded-3xl bg-[#0e091c] px-4 py-10 text-[#f4f1ff] sm:px-12 sm:py-14">
          <div className="mx-auto grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
            <div className="justify-self-center text-center">
              <div className="duel-l mx-auto w-[clamp(4.5rem,16vw,10rem)]">
                <Swimmer who="shelly" flip className="w-full" />
              </div>
              <p style={{ maxWidth: "none" }} className="mt-4 font-[family-name:var(--font-vt323)] text-[clamp(1.2rem,2.4vw,1.75rem)] leading-none">YOU</p>
            </div>
            {/* the face leaves 1/8em after each glyph: the left pad re-centres the pair */}
            <p aria-hidden style={{ maxWidth: "none" }} className="pl-[0.125em] font-[family-name:var(--font-pressstart)] text-[clamp(1.5rem,5vw,3.4rem)] leading-none text-[#ffae45]">
              VS
            </p>
            <div className="justify-self-center text-center">
              <div className="duel-r mx-auto w-[clamp(4.5rem,16vw,10rem)]">
                <Swimmer who="finn" className="w-full" />
              </div>
              <p style={{ maxWidth: "none" }} className="mt-4 font-[family-name:var(--font-vt323)] text-[clamp(1.2rem,2.4vw,1.75rem)] leading-none">YOUR FRIEND</p>
            </div>
          </div>
          <p style={{ maxWidth: "none" }} className="mt-9 text-center font-[family-name:var(--font-vt323)] text-[clamp(1.35rem,2.6vw,1.9rem)] leading-tight">
            SAME COIN. YOUR TURN.
            <span className="block text-[#a79fc9]">NO BETS. BEST TRADE WINS.</span>
          </p>
        </Rise>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12 [&>*]:min-w-0">
          <div>
            <dl className="grid gap-x-10 gap-y-7 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="font-bold">Challenge links</dt>
                <dd className="mt-1 text-ink-soft">Share your run as a card. Friends who open it see your score to beat, live in their round.</dd>
              </div>
              <div>
                <dt className="font-bold">Trade duels</dt>
                <dd className="mt-1 text-ink-soft">Finish a MEME DASH trade and dare a friend to beat it on the same coin. Everyone trades their own money.</dd>
              </div>
              <div>
                <dt className="font-bold">A handheld in your pocket</dt>
                <dd className="mt-1 text-ink-soft">Runs on the web and as a 1 MB Android app for Solana Seeker. D&#8209;pad, A, B, done.</dd>
              </div>
              <div>
                <dt className="font-bold">Two cartridges in the box</dt>
                <dd className="mt-1 text-ink-soft">The fishing net is secretly money parked in a pool. MEME DASH is secretly buying meme coins. Neither screen uses those words.</dd>
              </div>
            </dl>
            <div className="mt-9">{cta}</div>
          </div>
          <KeyMap />
        </div>
      </div>
    </section>
  );
}
