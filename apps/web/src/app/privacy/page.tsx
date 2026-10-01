// DRAFT for the owner to review before the dApp Store submission. Written from what the code does
// (session.ts, meme.ts, chain.ts, prices.ts, pools.ts, the two API routes). Not legal advice.

export const metadata = {
  title: "Privacy and keys · SCRAPPY BOY",
  description: "What SCRAPPY BOY stores, who it talks to, and who holds the keys.",
};

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "No account, no sign-up",
    p: [
      "SCRAPPY BOY has no accounts. We do not ask for a name, an email address or a phone number, and we run no analytics or advertising trackers.",
      "This page covers SCRAPPY BOY at /scrappyboy and the Android app, which opens the same site.",
    ],
  },
  {
    h: "What stays on your device",
    p: [
      "The game saves a few things in your browser's storage on this device: your best score, your daily streak and quest, a trade you have open in MEME DASH, and the play key described below. Clearing the site's data removes all of it. None of it is sent to us.",
    ],
  },
  {
    h: "Who holds the keys",
    p: [
      "Your wallet stays yours. On Solana mainnet, every MEME DASH buy and sell is a transaction your own wallet shows you and you approve. The coins you buy sit in your wallet. We never see or store your wallet's keys.",
      "The play key is a second keypair the game creates on your device so the free cartridges can run without a wallet popup on every move. It is stored only in this browser, it is used on Solana devnet where tokens have no value, and it never leaves your device. If you ever loaded funds into it, the X button sends everything it holds back to your connected wallet.",
    ],
  },
  {
    h: "What is public",
    p: [
      "Solana is a public ledger. Any transaction you approve, your wallet address, and a score you save on chain can be seen by anyone, permanently. That is how the network works and we cannot remove it.",
      "A duel link you choose to share contains the coin, your result, the first four characters of your address and the signature of your sell, so your friend can check it.",
    ],
  },
  {
    h: "Services the game talks to",
    p: [
      "To show prices and place trades, your device contacts these services directly, and each can see your IP address under its own policy: Coinbase (SOL price), Jupiter (coin list, prices and swaps), GeckoTerminal (candles and trending coins), Orca (pool list and liquidity positions) and the public Solana devnet RPC.",
      "Mainnet RPC calls and coin icons pass through our own server, hosted on Vercel, which keeps standard short-lived request logs including IP addresses. Your wallet app has its own policy.",
    ],
  },
  {
    h: "Trading",
    p: [
      "MEME DASH trades with your own money and you can lose it. The -8% and +15% auto-sell lines only work while the trade screen is open on your device. Nothing here is financial advice.",
    ],
  },
  {
    h: "Questions",
    p: ["Open an issue on the project's GitHub repository and we will answer there."],
  },
];

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24 sm:px-8">
      <a href="/" className="text-[14px] font-semibold text-ink-soft transition-colors hover:text-ink">
        scrappypet
      </a>
      <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.015em]">Privacy and keys</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">What SCRAPPY BOY stores, who it talks to, and who holds the keys.</p>
      {SECTIONS.map((s) => (
        <section key={s.h} className="mt-12">
          <h2 className="font-display text-2xl font-bold tracking-[-0.005em]">{s.h}</h2>
          {s.p.map((t) => (
            <p key={t} className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              {t}
            </p>
          ))}
        </section>
      ))}
      <p className="mt-16 text-[14px] text-ink-faint">Last updated October 2026.</p>
    </main>
  );
}
