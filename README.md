# SCRAPPY BOY

**Crypto is hard. So we made it a game.**

A handheld where every button is a Solana action. Ride the price, press A, and your
trade lands on chain. No order book, no slippage settings, no textbook of words: four
buttons. Built for **CLOCK IN, the Solana Mobile hackathon** (Seeker / Solana Mobile Stack).

Play it now: **[scrappypet.vercel.app/scrappyboy](https://scrappypet.vercel.app/scrappyboy)**

## What's in the box

Three cartridges on one handheld:

| Cartridge | What you see | What the buttons do on chain |
|---|---|---|
| **PLAY NOW** | An endless round on the live SOL price | Nothing. Points are free. This is how you learn the controls. |
| **DEEP NET** | "Cast a net into the sea" | Opens an Orca liquidity position on devnet; "collect coins" harvests its fees; "pull the net" closes the position and returns the funds. |
| **MEME DASH** | A coin carousel and a live chart | `A` buys with a Jupiter swap on Solana **mainnet** ($1 to $50, or 100 SKR). `B` sells. While the trade screen is open, the safety net and treasure line sell for you at -8% / +15%. Coins are the day's most traded on Jupiter plus GeckoTerminal's trending pools, with SKR pinned first. `?net=devnet` swaps through the Orca devnet pool instead, at no cost. |

## Who signs what

- **Trades are yours.** On mainnet, every MEME DASH buy and sell is approved in your own
  wallet (Phantom, Solflare, Backpack, or the Seeker wallet through Mobile Wallet Adapter).
  The coins you buy stay in that wallet. A sell only sells what that trade bought.
- **The play key is for free play.** The console creates a keypair on your device so the
  devnet cartridges can sign without a popup on every move. It lives only in the browser
  and holds nothing of value. `X` sends anything it holds back to your connected wallet,
  tokens first, then SOL.
- **A trade survives a reload.** An open trade is saved on the device and restored the next
  time MEME DASH opens.

## Trade duels

Finish a MEME DASH trade, press up on the result screen, and send the link to a friend.
They land on the same coin with your result as the one to beat, trade with their own money,
and the result screen says who won. Nothing is staked between players and nothing is paid
to the winner. The link carries the challenger's sell signature so the trade can be checked
on the explorer, and it can only seat a coin that is on the day's list or that Jupiter marks
verified.

## The program: `scrappy_arcade`

`programs/scrappy-arcade` is an Anchor program: an on-chain save card and link battles.

- `record_score`: a `SaveCard` PDA per player keeps best, last and plays on chain. It accepts
  the player's own key or a MagicBlock session token (`session-keys` crate).
- `create_battle` / `join_battle` / `post_battle_score`: a `Battle` PDA is a shared scoreboard.
  The host creates it, a friend joins from a link, both post one score.

Program ID (devnet): `6JWs3RjaawXTHvjFmFq2UxWiX8HPpxfi71WsGeLqVXm3`
Build: `anchor build` inside WSL (toolchain note in `scripts/wsl-build2.sh`).

## Networks

- **MEME DASH trades on mainnet** by default: Jupiter swaps, with `solscan.io` links in the
  transaction log under the console.
- **Add `?net=devnet`** and the same cartridge trades SOL/devUSDC through the Orca devnet
  whirlpool instead.
- **DEEP NET runs on devnet** (Orca whirlpools): same mechanics, no cost.
- The core round is free: no wallet needed until you trade.

## Verify

```bash
bun install
bun run verify     # typecheck + eslint + all tests
bun run dev        # http://localhost:3000/scrappyboy
```

`bun run verify` runs `tsc --noEmit` on every workspace, `eslint` (errors fail), and the test
suite: score math, stake to lamports, USD formatting, auto-sell triggers, daily streaks and
duel links.

Production deploy: `vercel deploy --prod`, aliased to scrappypet.vercel.app.

## Stack

- Next.js 16 + React 19, TypeScript, Bun workspaces
- `@solana/web3.js` + wallet-adapter for wallet-approved trades
- `@solana/kit` for devnet operations
- Jupiter Lite API (token discovery, quotes, swaps) and Price API
- Orca whirlpools via `@orca-so/whirlpools-*` on devnet
- Anchor 0.32 for `scrappy_arcade`
- The console itself: a DOM/CSS shell around two canvas carts, a 160x144 indexed-colour
  framebuffer (16-colour palette, tilemaps, sprites, a 4x6 bitmap font) and a 640x576
  canvas for MEME DASH

## Project layout

```
apps/web/src/app/scrappyboy/   the handheld page (Shell + Handheld)
apps/web/src/lib/scrappyboy/   game, meme dash, chain, session, sprites
apps/web/src/lib/console/      the pixel console (canvas, input, audio)
apps/web/src/app/api/          /api/rpc (mainnet proxy), /api/icon (token art)
apps/web/src/app/privacy/      privacy and keys
programs/scrappy-arcade/       the Anchor program
scripts/                       deploy-arcade.mjs, wsl-build helpers
```

## Roadmap

- Link battles screen (the `Battle` PDA is already in the program)
- Deeper SKR use: SKR stakes, holder perks
- Seed Vault signing on Seeker
- Solana dApp Store listing
