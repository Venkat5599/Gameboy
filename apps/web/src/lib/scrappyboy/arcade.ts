import {
  type Address,
  address,
  AccountRole,
  getAddressDecoder,
  getAddressEncoder,
  getProgramDerivedAddress,
  type Instruction,
  type TransactionSigner,
} from "@solana/kit";
import { rpc, sendIxs, withRetry } from "./chain";

/**
 * Client for the SCRAPPY BOY arcade program (`programs/scrappy-arcade`).
 * Instructions are built by hand - the accounts are few, the data is one or two
 * numbers, and we get to skip an anchor client dependency entirely.
 *
 * Programs calls sign with the play key as `signer`. When a wallet later issues
 * a MagicBlock SessionToken for the play key, the same calls carry it as
 * `sessionToken` - no program change needed.
 */

export const ARCADE_PROGRAM = address("6JWs3RjaawXTHvjFmFq2UxWiX8HPpxfi71WsGeLqVXm3");
const SYSTEM = address("11111111111111111111111111111111");

// sha256("global:<ix>")[..8], computed once at build time.
const DISC = {
  recordScore: new Uint8Array([30, 181, 94, 137, 7, 160, 236, 158]),
  createBattle: new Uint8Array([2, 249, 54, 216, 42, 99, 187, 102]),
  joinBattle: new Uint8Array([126, 0, 69, 130, 127, 145, 54, 100]),
  postBattleScore: new Uint8Array([99, 116, 228, 59, 219, 156, 166, 249]),
};

const u32le = (n: number) => new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]);

function u64le(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  for (let i = 0; i < 8; i++) b[i] = Number((n >> BigInt(8 * i)) & BigInt(0xff));
  return b;
}

function cat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Whether the program is actually deployed and executable on this cluster. */
export async function programDeployed(): Promise<boolean> {
  try {
    const { value } = await rpc.getAccountInfo(ARCADE_PROGRAM).send();
    return !!value?.executable;
  } catch {
    return false;
  }
}

export async function saveCardPda(player: Address): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: ARCADE_PROGRAM,
    seeds: ["save_card", getAddressEncoder().encode(player)],
  });
  return pda;
}

export async function battlePda(battleId: bigint): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: ARCADE_PROGRAM,
    seeds: ["battle", u64le(battleId)],
  });
  return pda;
}

export interface SaveCardData {
  player: Address;
  best: number;
  last: number;
  plays: number;
  updatedAt: bigint;
}

/** Read a save card straight from the chain. null when the player has none. */
export async function readSaveCard(player: Address): Promise<SaveCardData | null> {
  const pda = await saveCardPda(player);
  const { value } = await withRetry(() => rpc.getAccountInfo(pda, { encoding: "base64" }).send());
  if (!value) return null;
  const d = Buffer.from(value.data[0]!, "base64");
  const view = new DataView(d.buffer, d.byteOffset, d.byteLength);
  return {
    player: getAddressDecoder().decode(d.subarray(8, 40)),
    best: view.getUint32(40, true),
    last: view.getUint32(44, true),
    plays: view.getUint32(48, true),
    updatedAt: view.getBigInt64(52, true),
  };
}

/** Read a friend's save card by their play key address string. */
export async function readSaveCardFor(playerAddress: string): Promise<SaveCardData | null> {
  return readSaveCard(address(playerAddress));
}

/**
 * record_score(player, score): writes best/last/plays on the card PDA.
 * `signer` is the play key; `player` is who the card belongs to (same today).
 * The third account is the optional MagicBlock SessionToken - the program's own
 * id is the anchor convention for "none".
 */
export async function recordScore(signer: TransactionSigner, player: Address, score: number): Promise<string> {
  const card = await saveCardPda(player);
  const ix: Instruction = {
    programAddress: ARCADE_PROGRAM,
    accounts: [
      { address: card, role: AccountRole.WRITABLE },
      { address: player, role: AccountRole.READONLY },
      { address: ARCADE_PROGRAM, role: AccountRole.READONLY }, // session_token: none
      { address: signer.address, role: AccountRole.WRITABLE_SIGNER },
      { address: SYSTEM, role: AccountRole.READONLY },
    ],
    data: cat(DISC.recordScore, u32le(score)),
  };
  return sendIxs(signer, [ix]);
}

export async function createBattle(signer: TransactionSigner, battleId: bigint): Promise<string> {
  const pda = await battlePda(battleId);
  const ix: Instruction = {
    programAddress: ARCADE_PROGRAM,
    accounts: [
      { address: pda, role: AccountRole.WRITABLE },
      { address: signer.address, role: AccountRole.WRITABLE_SIGNER },
      { address: SYSTEM, role: AccountRole.READONLY },
    ],
    data: cat(DISC.createBattle, u64le(battleId)),
  };
  return sendIxs(signer, [ix]);
}

export async function joinBattle(signer: TransactionSigner, battleId: bigint): Promise<string> {
  const pda = await battlePda(battleId);
  const ix: Instruction = {
    programAddress: ARCADE_PROGRAM,
    accounts: [
      { address: pda, role: AccountRole.WRITABLE },
      { address: signer.address, role: AccountRole.READONLY_SIGNER },
    ],
    data: cat(DISC.joinBattle, u64le(battleId)),
  };
  return sendIxs(signer, [ix]);
}

/** Post this seat's score. `who` is the seat's key (signer today, session authority later). */
export async function postBattleScore(signer: TransactionSigner, who: Address, battleId: bigint, score: number): Promise<string> {
  const pda = await battlePda(battleId);
  const ix: Instruction = {
    programAddress: ARCADE_PROGRAM,
    accounts: [
      { address: pda, role: AccountRole.WRITABLE },
      { address: who, role: AccountRole.READONLY },
      { address: ARCADE_PROGRAM, role: AccountRole.READONLY }, // session_token: none
      { address: signer.address, role: AccountRole.WRITABLE_SIGNER },
    ],
    data: cat(DISC.postBattleScore, u64le(battleId), u32le(score)),
  };
  return sendIxs(signer, [ix]);
}

export interface BattleData {
  host: Address;
  guest: Address;
  scores: [number, number];
  posted: [boolean, boolean];
}

export async function readBattle(battleId: bigint): Promise<BattleData | null> {
  const pda = await battlePda(battleId);
  const { value } = await withRetry(() => rpc.getAccountInfo(pda, { encoding: "base64" }).send());
  if (!value) return null;
  const d = Buffer.from(value.data[0]!, "base64");
  const view = new DataView(d.buffer, d.byteOffset, d.byteLength);
  return {
    host: getAddressDecoder().decode(d.subarray(16, 48)),
    guest: getAddressDecoder().decode(d.subarray(48, 80)),
    scores: [view.getUint32(80, true), view.getUint32(84, true)],
    posted: [d[88] === 1, d[89] === 1],
  };
}
