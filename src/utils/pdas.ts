/**
 * PDA derivation helpers for Sharky, Metaplex, and SPL programs.
 *
 * PDAs (Program Derived Addresses) are deterministic addresses
 * derived from "seeds" + a program ID. They're used to locate
 * accounts like escrows, metadata, editions, etc.
 */

import {
  getProgramDerivedAddress,
  getAddressEncoder,
  type Address,
  type ProgramDerivedAddress,
} from '@solana/kit';

// Program IDs
export const TOKEN_METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as Address;
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address;
export const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address;
export const AUTH_RULES_PROGRAM_ID = 'auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg' as Address;
export const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111' as Address;
export const SYSVAR_RENT_ID = 'SysvarRent111111111111111111111111111111111' as Address;

const encoder = getAddressEncoder();
const textEncoder = new TextEncoder();

/**
 * Derive the escrow PDA for a loan.
 * Seeds: [loan_pubkey] + sharky_program_id
 */
export async function findEscrowAddress(
  loanPubkey: Address,
  programId: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: programId,
    seeds: [encoder.encode(loanPubkey)],
  });
}

/**
 * Derive the Metaplex metadata account for an NFT mint.
 * Seeds: ["metadata", metadata_program_id, mint]
 */
export async function findMetadataAddress(
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: TOKEN_METADATA_PROGRAM_ID,
    seeds: [
      textEncoder.encode('metadata'),
      encoder.encode(TOKEN_METADATA_PROGRAM_ID),
      encoder.encode(mint),
    ],
  });
}

/**
 * Derive the Metaplex master edition account for an NFT mint.
 * Seeds: ["metadata", metadata_program_id, mint, "edition"]
 */
export async function findEditionAddress(
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: TOKEN_METADATA_PROGRAM_ID,
    seeds: [
      textEncoder.encode('metadata'),
      encoder.encode(TOKEN_METADATA_PROGRAM_ID),
      encoder.encode(mint),
      textEncoder.encode('edition'),
    ],
  });
}

/**
 * Derive the pNFT token record PDA.
 * Seeds: ["metadata", metadata_program_id, mint, "token_record", token_account]
 * Only needed for programmable NFTs (pNFTs).
 */
export async function findTokenRecordAddress(
  mint: Address,
  tokenAccount: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: TOKEN_METADATA_PROGRAM_ID,
    seeds: [
      textEncoder.encode('metadata'),
      encoder.encode(TOKEN_METADATA_PROGRAM_ID),
      encoder.encode(mint),
      textEncoder.encode('token_record'),
      encoder.encode(tokenAccount),
    ],
  });
}

/**
 * Derive an Associated Token Account (ATA) address.
 * Seeds: [owner, token_program, mint]
 */
export async function findAssociatedTokenAddress(
  owner: Address,
  mint: Address,
  tokenProgramId: Address = TOKEN_PROGRAM_ID,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      encoder.encode(owner),
      encoder.encode(tokenProgramId),
      encoder.encode(mint),
    ],
  });
}

/**
 * Derive a Metaplex auth rules RuleSet PDA.
 * Seeds: [payer, name]
 */
export async function findRuleSetAddress(
  payer: Address,
  name: string,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: AUTH_RULES_PROGRAM_ID,
    seeds: [
      encoder.encode(payer),
      textEncoder.encode(name),
    ],
  });
}
