/**
 * High-level foreclose helpers.
 *
 * Handles both Legacy/pNFT (V3) and Core NFT foreclosures.
 */

import type { Address, TransactionSigner } from '@solana/kit';
import { getForecloseLoanV3Instruction } from '../generated/instructions/forecloseLoanV3';
import { getForecloseLoanCoreInstruction } from '../generated/instructions/forecloseLoanCore';
import { SHARKY_PROGRAM_ADDRESS } from '../generated/programs/sharky';
import { MPL_CORE_PROGRAM_ID } from '../constants';
import {
  findEscrowAddress,
  findAssociatedTokenAddress,
  findMetadataAddress,
  findEditionAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
} from '../utils/pdas';

export type NftStandard = 'legacy' | 'pnft' | 'core';

export interface ForecloseParams {
  lender: TransactionSigner;
  loan: Address;
  borrower: Address;
  collateralMint: Address;
  nftStandard: NftStandard;
  collection?: Address;
  programId?: Address;
}

/**
 * Build a foreclose instruction, routing to V3 or Core.
 */
export async function createForecloseInstruction(params: ForecloseParams) {
  const {
    lender,
    loan,
    borrower,
    collateralMint,
    nftStandard,
    collection,
    programId = SHARKY_PROGRAM_ADDRESS,
  } = params;

  if (nftStandard === 'core') {
    return createForeclose_Core(lender, loan, borrower, collateralMint, programId, collection);
  }

  return createForeclose_V3(lender, loan, borrower, collateralMint, programId);
}

async function createForeclose_V3(
  lender: TransactionSigner,
  loan: Address,
  borrower: Address,
  collateralMint: Address,
  programId: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);
  const [escrowCollateralTokenAccount] = await findAssociatedTokenAddress(escrow, collateralMint);
  const [lenderCollateralTokenAccount] = await findAssociatedTokenAddress(lender.address, collateralMint);
  const [borrowerCollateralTokenAccount] = await findAssociatedTokenAddress(borrower, collateralMint);
  const [metadata] = await findMetadataAddress(collateralMint);
  const [edition] = await findEditionAddress(collateralMint);

  return getForecloseLoanV3Instruction({
    lender,
    loan,
    borrower,
    collateralMint,
    escrow,
    escrowCollateralTokenAccount,
    lenderCollateralTokenAccount,
    borrowerCollateralTokenAccount,
    metadata,
    edition,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    mplTokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  }, { programAddress: programId });
}

async function createForeclose_Core(
  lender: TransactionSigner,
  loan: Address,
  borrower: Address,
  collateralMint: Address,
  programId: Address,
  collection?: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);

  return getForecloseLoanCoreInstruction({
    lender,
    loan,
    borrower,
    collateralMint,
    escrow,
    collection: collection ?? undefined,
    mplCoreProgram: MPL_CORE_PROGRAM_ID as Address,
  }, { programAddress: programId });
}
