use anchor_lang::prelude::*;
use session_keys::{session_auth_or, Session, SessionError, SessionToken};

declare_id!("6JWs3RjaawXTHvjFmFq2UxWiX8HPpxfi71WsGeLqVXm3");

/// SCRAPPY BOY arcade program.
///
/// The SAVE CARD is on-chain for real: a PDA per player that keeps best score,
/// last score and total runs. Score writes accept either the player's own key
/// or a MagicBlock session token (`session-keys` crate): the wallet issues a
/// scoped, expiring SessionToken for a device key, and that key writes on the
/// player's behalf with zero further popups.
#[program]
pub mod scrappy_arcade {
    use super::*;

    /// Write a score to the player's save card. First write creates it.
    /// Signs with the player's key, or a session delegate's key + SessionToken.
    #[session_auth_or(
        ctx.accounts.player.key() == ctx.accounts.signer.key(),
        SessionError::InvalidToken
    )]
    pub fn record_score(ctx: Context<RecordScore>, score: u32) -> Result<()> {
        let card = &mut ctx.accounts.save_card;
        card.player = ctx.accounts.player.key();
        card.bump = ctx.bumps.save_card;
        write_score(card, score)
    }

    // ---- link battles ------------------------------------------------------
    //
    // A Battle PDA `[b"battle", id]` is the shared scoreboard: the host creates
    // it, a friend joins with a link, both post one score, and the contract
    // records the result. Score posts accept a seat's own key or a session
    // delegate, so a device play key can battle without a wallet popup.

    pub fn create_battle(ctx: Context<CreateBattle>, battle_id: u64) -> Result<()> {
        let b = &mut ctx.accounts.battle;
        b.id = battle_id;
        b.host = ctx.accounts.host.key();
        b.guest = Pubkey::default();
        b.scores = [0, 0];
        b.posted = [false, false];
        b.bump = ctx.bumps.battle;
        Ok(())
    }

    pub fn join_battle(ctx: Context<JoinBattle>, _battle_id: u64) -> Result<()> {
        let b = &mut ctx.accounts.battle;
        require!(b.guest == Pubkey::default(), ArcadeError::BattleFull);
        b.guest = ctx.accounts.guest.key();
        Ok(())
    }

    /// One score post per seat. The seat is `who`; the submitter is either the
    /// seat itself or its session delegate.
    #[session_auth_or(
        ctx.accounts.who.key() == ctx.accounts.signer.key(),
        SessionError::InvalidToken
    )]
    pub fn post_battle_score(ctx: Context<PostBattleScore>, _battle_id: u64, score: u32) -> Result<()> {
        let b = &mut ctx.accounts.battle;
        let who = ctx.accounts.who.key();
        let slot = if who == b.host {
            0
        } else if who == b.guest {
            1
        } else {
            return err!(ArcadeError::NotInBattle);
        };
        require!(b.guest != Pubkey::default(), ArcadeError::BattleNotJoined);
        require!(!b.posted[slot], ArcadeError::AlreadyPosted);
        b.scores[slot] = score;
        b.posted[slot] = true;
        Ok(())
    }
}

fn write_score(card: &mut Account<SaveCard>, score: u32) -> Result<()> {
    if score > card.best {
        card.best = score;
    }
    card.last = score;
    card.plays = card.plays.checked_add(1).ok_or(ArcadeError::Overflow)?;
    card.updated_at = Clock::get()?.unix_timestamp;
    Ok(())
}

#[derive(Accounts, Session)]
pub struct RecordScore<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + SaveCard::INIT_SPACE,
        seeds = [b"save_card", player.key().as_ref()],
        bump,
    )]
    pub save_card: Account<'info, SaveCard>,
    /// CHECK: the player this card belongs to. Vouched by the signer directly or
    /// by the session token's authority.
    pub player: AccountInfo<'info>,
    #[session(
        signer = signer,
        authority = player.key()
    )]
    pub session_token: Option<Account<'info, SessionToken>>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct SaveCard {
    pub player: Pubkey,
    pub best: u32,
    pub last: u32,
    pub plays: u32,
    pub updated_at: i64,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(battle_id: u64)]
pub struct CreateBattle<'info> {
    #[account(
        init,
        payer = host,
        space = 8 + Battle::INIT_SPACE,
        seeds = [b"battle", battle_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub battle: Account<'info, Battle>,
    #[account(mut)]
    pub host: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(battle_id: u64)]
pub struct JoinBattle<'info> {
    #[account(
        mut,
        seeds = [b"battle", battle_id.to_le_bytes().as_ref()],
        bump = battle.bump,
    )]
    pub battle: Account<'info, Battle>,
    pub guest: Signer<'info>,
}

#[derive(Accounts, Session)]
#[instruction(battle_id: u64)]
pub struct PostBattleScore<'info> {
    #[account(
        mut,
        seeds = [b"battle", battle_id.to_le_bytes().as_ref()],
        bump = battle.bump,
    )]
    pub battle: Account<'info, Battle>,
    /// CHECK: the seat this score is for. Vouched by signer or session authority.
    pub who: AccountInfo<'info>,
    #[session(
        signer = signer,
        authority = who.key()
    )]
    pub session_token: Option<Account<'info, SessionToken>>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Battle {
    pub id: u64,
    pub host: Pubkey,
    pub guest: Pubkey,
    pub scores: [u32; 2],
    pub posted: [bool; 2],
    pub bump: u8,
}

#[error_code]
pub enum ArcadeError {
    #[msg("play counter overflowed")]
    Overflow,
    #[msg("battle already has a guest")]
    BattleFull,
    #[msg("nobody has joined this battle yet")]
    BattleNotJoined,
    #[msg("signer is not a player in this battle")]
    NotInBattle,
    #[msg("this seat already posted its score")]
    AlreadyPosted,
}
