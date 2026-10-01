import { createKeyPairSignerFromBytes, type TransactionSigner } from "@solana/kit";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

/**
 * The play key: an ephemeral keypair minted on this device the first time the console boots.
 *
 * It is the game's scoped session key. The player's own wallet signs exactly one transaction -
 * the top-up - and from then on every move (devnet LP ops, mainnet meme swaps, auto-sells) is
 * signed on-device by the play key. Hard scope: it can only ever spend what was deposited into
 * the coin slot. A kid's phrase for it is "the coins in the machine"; on-chain it is a fresh
 * address whose game activity is not tied to the player's main wallet.
 *
 * Honesty note: the secret lives in localStorage. That is fine for pocket change (the design
 * caps exposure at the deposited amount) and becomes a Seed Vault key when a native build needs it.
 */
const STORE = "scrappyboy.session.v1";
const TX_FEE = BigInt(10_000); // headroom over the ~5k lamport base fee

async function confirm(conn: Connection, sig: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const { value } = await conn.getSignatureStatuses([sig]);
    const s = value[0];
    if (s?.err) throw new Error("transaction failed on-chain");
    if (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized") return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("transaction not confirmed in 60 s");
}

export class SessionWallet {
  private constructor(readonly keypair: Keypair) {}

  /** Load the device's play key, or mint and store a fresh one. */
  static load(): SessionWallet {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) return new SessionWallet(Keypair.fromSecretKey(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))));
    } catch {
      /* corrupt entry -> mint a fresh key below */
    }
    const kp = Keypair.generate();
    try {
      localStorage.setItem(STORE, btoa(String.fromCharCode(...kp.secretKey)));
    } catch {
      /* private mode: session lives in memory only */
    }
    return new SessionWallet(kp);
  }

  get address(): string {
    return this.keypair.publicKey.toBase58();
  }

  /** Sign + send a swap transaction (base64 v0) with the play key. No wallet popup. */
  async send(conn: Connection, b64: string): Promise<string> {
    const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    tx.sign([this.keypair]);
    const sig = await conn.sendRawTransaction(tx.serialize());
    await confirm(conn, sig);
    return sig;
  }

  async solBalance(conn: Connection): Promise<bigint> {
    return BigInt(await conn.getBalance(this.keypair.publicKey));
  }

  async tokenBalance(conn: Connection, mint: string): Promise<bigint> {
    const accs = await conn.getParsedTokenAccountsByOwner(this.keypair.publicKey, { mint: new PublicKey(mint) });
    return accs.value.reduce((sum, a) => sum + BigInt((a.account.data.parsed.info.tokenAmount as { amount: string }).amount), BigInt(0));
  }

  /**
   * Send every token the play key holds to the wallet's own token account (created if missing):
   * an open meme position, SKR, anything a swap left behind. Returns the last signature, or null.
   */
  private async sweepTokens(conn: Connection, to: PublicKey): Promise<string | null> {
    const me = this.keypair.publicKey;
    let last: string | null = null;
    for (const program of [TOKEN_PROGRAM, TOKEN_2022_PROGRAM]) {
      const accs = await conn.getParsedTokenAccountsByOwner(me, { programId: program });
      for (const a of accs.value) {
        const info = a.account.data.parsed.info as { mint: string; tokenAmount: { amount: string; decimals: number } };
        const amount = BigInt(info.tokenAmount.amount);
        if (amount <= BigInt(0)) continue;
        const mint = new PublicKey(info.mint);
        const [dest] = PublicKey.findProgramAddressSync([to.toBuffer(), program.toBuffer(), mint.toBuffer()], ATA_PROGRAM);
        const data = new Uint8Array(10);
        data[0] = 12; // TransferChecked: works for both token programs
        new DataView(data.buffer).setBigUint64(1, amount, true);
        data[9] = info.tokenAmount.decimals;
        const tx = new Transaction().add(
          // create the wallet's token account if it does not exist yet (idempotent)
          new TransactionInstruction({
            programId: ATA_PROGRAM,
            data: Buffer.from([1]),
            keys: [
              { pubkey: me, isSigner: true, isWritable: true },
              { pubkey: dest, isSigner: false, isWritable: true },
              { pubkey: to, isSigner: false, isWritable: false },
              { pubkey: mint, isSigner: false, isWritable: false },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
              { pubkey: program, isSigner: false, isWritable: false },
            ],
          }),
          new TransactionInstruction({
            programId: program,
            data: Buffer.from(data),
            keys: [
              { pubkey: a.pubkey, isSigner: false, isWritable: true },
              { pubkey: mint, isSigner: false, isWritable: false },
              { pubkey: dest, isSigner: false, isWritable: true },
              { pubkey: me, isSigner: true, isWritable: false },
            ],
          }),
        );
        // close the emptied account so its rent comes back too (classic token program only)
        if (program.equals(TOKEN_PROGRAM)) {
          tx.add(
            new TransactionInstruction({
              programId: program,
              data: Buffer.from([9]),
              keys: [
                { pubkey: a.pubkey, isSigner: false, isWritable: true },
                { pubkey: me, isSigner: false, isWritable: true },
                { pubkey: me, isSigner: true, isWritable: false },
              ],
            }),
          );
        }
        tx.feePayer = me;
        tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
        tx.sign(this.keypair);
        last = await conn.sendRawTransaction(tx.serialize());
        await confirm(conn, last);
      }
    }
    return last;
  }

  /**
   * Cash out: everything the play key holds goes back to the player's own wallet. Tokens first,
   * then the SOL (minus the fee). The play key signs.
   */
  async sweep(conn: Connection, to: PublicKey): Promise<string> {
    const tokenSig = await this.sweepTokens(conn, to);
    const bal = await conn.getBalance(this.keypair.publicKey);
    const amount = BigInt(bal) - TX_FEE;
    if (amount <= BigInt(0)) {
      if (tokenSig) return tokenSig;
      throw new Error("coin slot is empty");
    }
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: this.keypair.publicKey, toPubkey: to, lamports: amount }),
    );
    tx.feePayer = this.keypair.publicKey;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    tx.sign(this.keypair);
    const sig = await conn.sendRawTransaction(tx.serialize());
    await confirm(conn, sig);
    return sig;
  }

  /** The same key as a Solana Kit signer, so devnet cartridge moves sign silently too. */
  kitSigner(): Promise<TransactionSigner> {
    return createKeyPairSignerFromBytes(this.keypair.secretKey) as Promise<TransactionSigner>;
  }
}
