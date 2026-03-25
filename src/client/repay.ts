/**
 * High-level repay helpers.
 *
 * Handles both Legacy/pNFT (V3) and Core NFT repayments.
 */

import type { Address, TransactionSigner } from '@solana/kit';
import { getRepayLoanV3Instruction } from '../generated/instructions/repayLoanV3';
import { getRepayLoanCoreInstruction } from '../generated/instructions/repayLoanCore';
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
import type { NftStandard } from './foreclose';

const NATIVE_MINT = 'So11111111111111111111111111111111111111112' as Address;

export interface RepayParams {
  borrower: TransactionSigner;
  loan: Address;
  lender: Address;
  orderBook: Address;
  feeAuthority: Address;
  collateralMint: Address;
  nftStandard: NftStandard;
  valueMint?: Address;
  collection?: Address;
  programId?: Address;
}

/**
 * Build a repay instruction, routing to V3 or Core.
 */
export async function createRepayInstruction(params: RepayParams) {
  const {
    borrower,
    loan,
    lender,
    orderBook,
    feeAuthority,
    collateralMint,
    nftStandard,
    valueMint = NATIVE_MINT,
    collection,
    programId = SHARKY_PROGRAM_ADDRESS,
  } = params;

  if (nftStandard === 'core') {
    return createRepay_Core(borrower, loan, lender, orderBook, feeAuthority, collateralMint, valueMint, programId, collection);
  }

  return createRepay_V3(borrower, loan, lender, orderBook, feeAuthority, collateralMint, valueMint, programId);
}

async function createRepay_V3(
  borrower: TransactionSigner,
  loan: Address,
  lender: Address,
  orderBook: Address,
  feeAuthority: Address,
  collateralMint: Address,
  valueMint: Address,
  programId: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);
  const [escrowCollateralTokenAccount] = await findAssociatedTokenAddress(escrow, collateralMint);
  const [borrowerCollateralTokenAccount] = await findAssociatedTokenAddress(borrower.address, collateralMint);
  const [metadata] = await findMetadataAddress(collateralMint);
  const [edition] = await findEditionAddress(collateralMint);

  return getRepayLoanV3Instruction({
    borrower,
    loan,
    lender,
    escrow,
    escrowCollateralTokenAccount,
    borrowerCollateralTokenAccount,
    collateralMint,
    valueMint,
    orderBook,
    feeAuthority,
    metadata,
    edition,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    mplTokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  }, { programAddress: programId });
}

async function createRepay_Core(
  borrower: TransactionSigner,
  loan: Address,
  lender: Address,
  orderBook: Address,
  feeAuthority: Address,
  collateralMint: Address,
  valueMint: Address,
  programId: Address,
  collection?: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);

  return getRepayLoanCoreInstruction({
    borrower,
    loan,
    lender,
    escrow,
    collateralMint,
    valueMint,
    orderBook,
    feeAuthority,
    collection: collection ?? undefined,
    mplCoreProgram: MPL_CORE_PROGRAM_ID as Address,
  }, { programAddress: programId });
}
