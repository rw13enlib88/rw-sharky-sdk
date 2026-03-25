/**
 * High-level take helpers — take a loan offer.
 *
 * Handles both Legacy/pNFT (V3) and Core NFT takes.
 */

import type { Address, TransactionSigner } from '@solana/kit';
import { getTakeLoanV3Instruction } from '../generated/instructions/takeLoanV3';
import { getTakeLoanCoreInstruction } from '../generated/instructions/takeLoanCore';
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

export interface TakeLoanParams {
  /** Borrower wallet (signer) */
  borrower: TransactionSigner;
  /** Loan offer address to take */
  loan: Address;
  /** Lender wallet address */
  lender: Address;
  /** OrderBook address */
  orderBook: Address;
  /** NFT collateral mint */
  collateralMint: Address;
  /** NFT standard: 'legacy', 'pnft', or 'core' */
  nftStandard: NftStandard;
  /** Collection address (required for Core NFTs) */
  collection?: Address;
  /** Override program address */
  programId?: Address;
}

/**
 * Build a take instruction, routing to V3 or Core.
 */
export async function createTakeInstruction(params: TakeLoanParams) {
  const {
    borrower,
    loan,
    lender,
    orderBook,
    collateralMint,
    nftStandard,
    collection,
    programId = SHARKY_PROGRAM_ADDRESS,
  } = params;

  // Validate inputs
  if (nftStandard === 'core' && !collection) {
    throw new Error('collection is required for Core NFTs');
  }

  if (nftStandard === 'core') {
    return createTake_Core(borrower, loan, lender, orderBook, collateralMint, programId, collection!);
  }

  return createTake_V3(borrower, loan, lender, orderBook, collateralMint, programId);
}

async function createTake_V3(
  borrower: TransactionSigner,
  loan: Address,
  lender: Address,
  orderBook: Address,
  collateralMint: Address,
  programId: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);
  const [borrowerCollateralTokenAccount] = await findAssociatedTokenAddress(borrower.address, collateralMint);
  const [escrowCollateralTokenAccount] = await findAssociatedTokenAddress(escrow, collateralMint);
  const [metadata] = await findMetadataAddress(collateralMint);
  const [edition] = await findEditionAddress(collateralMint);

  return getTakeLoanV3Instruction({
    lender,
    borrower,
    borrowerCollateralTokenAccount,
    collateralMint,
    loan,
    escrow,
    escrowCollateralTokenAccount,
    orderBook,
    metadata,
    edition,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    mplTokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    expectedLoan: '',
    nftListIndex: null,
    skipFreezingCollateral: false,
  }, { programAddress: programId });
}

async function createTake_Core(
  borrower: TransactionSigner,
  loan: Address,
  lender: Address,
  orderBook: Address,
  collateralMint: Address,
  programId: Address,
  collection: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);

  return getTakeLoanCoreInstruction({
    lender,
    borrower,
    collateralMint,
    collection,
    loan,
    escrow,
    orderBook,
    mplCoreProgram: MPL_CORE_PROGRAM_ID as Address,
    expectedLoan: '',
    nftListIndex: null,
  }, { programAddress: programId });
}
