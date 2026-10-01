# SCRAPPY BOY: TODO

**One line:** Crypto is hard, so we made it a game. A handheld where every button is a Solana action.
**Deadlines:** CLOCK IN **Oct 8** (APK + repo + demo video + deck) · Colosseum + Superteam Earn **Oct 11** (hard Oct 12).
**Rules:** no mocks, no invented numbers, no wagers between players, no AI features, ask before every GitHub push.

Product code: `../scrappy-classic` (branch site-classic). Film: `video/`.

## Done
- [x] Pixel console engine, handheld shell, three cartridges (PLAY NOW, DEEP NET, MEME DASH)
- [x] MEME DASH trades approved in the player's own wallet on mainnet; play key for free devnet play
- [x] Open trade saved on the device and restored; cash-out returns tokens and SOL
- [x] Trade duels by link (same coin, no stake)
- [x] `/api/rpc` method allowlist and rate limit; `/api/icon` public-https only, size cap, sandboxed
- [x] Promo film and landing page section; privacy and keys page (draft)
- [x] Swap fee code path (off until a fee account is set)

## Needs a person with a wallet
- [ ] Click through the preview: devnet trade, $1 mainnet trade, reload mid-trade, X, open a duel link
- [ ] Promote the preview to production once that passes
- [ ] Review the privacy page wording
- [ ] Create the wrapped-SOL fee account and set `NEXT_PUBLIC_SCRAPPY_FEE_ACCOUNT`

## Build next
- [ ] `anchor build` + deploy the rewritten `scrappy_arcade` to devnet; confirm save cards write
- [ ] Link battles screen (program has create, join, post score)
- [ ] Scores are client-reported: decide whether to verify or say so plainly
- [ ] Remove or archive the paused products' code and docs

## Seeker and the dApp Store
- [ ] Read the Publisher Policy; get the legal answer on MEME DASH for an Indian team
- [ ] Listing: descriptions, 512x512 icon, four or more screenshots, the film as preview
- [ ] Rebuild and sign the APK; test on a Seeker with Mobile Wallet Adapter
- [ ] Submit for review
- [ ] Seed Vault signing and deeper SKR use: build, or drop the claims

## Traction and submission
- [ ] Players: college clubs, Superteam India, friends. Log counts as they happen
- [ ] Daily build-in-public post
- [ ] Deck, demo video on a phone, pitch video, YC / Alliance / Solana Incubator answers
- [ ] **Submit CLOCK IN (Oct 8)**, then **Colosseum + Superteam Earn (Oct 11)**
