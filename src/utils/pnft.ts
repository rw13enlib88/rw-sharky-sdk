/**
 * pNFT (Programmable NFT) helpers.
 *
 * pNFTs require extra accounts in transactions: metadata, edition,
 * token records, and optionally auth rules. These helpers resolve
 * those accounts automatically.
 */

import type { Address, AccountMeta } from '@solana/kit';
import {
  findMetadataAddress,
  findEditionAddress,
  findTokenRecordAddress,
  TOKEN_METADATA_PROGRAM_ID,
  AUTH_RULES_PROGRAM_ID,
} from './pdas';

/** Account role constants for Solana AccountMeta */
export const enum AccountRole {
  Readonly = 0,
  Writable = 1,
}

/**
 * Get the remaining accounts needed for pNFT V3 transactions
 * (take, repay, foreclose, extend).
 *
 * These are appended to the instruction's account list.
 */
export async function getRemainingAccountsForPNftV3(
  mint: Address,
  ownerTokenAccount: Address,
  destinationTokenAccount: Address,
  ruleSetAddress?: Address,
): Promise<AccountMeta[]> {
  const [metadata] = await findMetadataAddress(mint);
  const [edition] = await findEditionAddress(mint);
  const [ownerTokenRecord] = await findTokenRecordAddress(mint, ownerTokenAccount);
  const [destTokenRecord] = await findTokenRecordAddress(mint, destinationTokenAccount);

  const accounts: AccountMeta[] = [
    // Metadata account (writable for pNFT operations)
    { address: metadata, role: 1 }, // writable
    // Master edition (readonly)
    { address: edition, role: 0 }, // readonly
    // Owner token record (writable)
    { address: ownerTokenRecord, role: 1 }, // writable
    // Destination token record (writable)
    { address: destTokenRecord, role: 1 }, // writable
    // Token Metadata program
    { address: TOKEN_METADATA_PROGRAM_ID, role: 0 }, // readonly
  ];

  // Auth rules (optional — only if collection has a rule set)
  if (ruleSetAddress) {
    accounts.push(
      { address: AUTH_RULES_PROGRAM_ID, role: 0 }, // readonly
      { address: ruleSetAddress, role: 0 }, // readonly
    );
  }

  return accounts;
}
