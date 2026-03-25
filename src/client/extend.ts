/**
 * High-level extend helpers — extend an active loan.
 *
 * Handles both Legacy/pNFT (V3) and Core NFT loan extensions.
 */

import type { Address, TransactionSigner } from '@solana/kit';
import { getExtendLoanV3Instruction } from '../generated/instructions/extendLoanV3';
import { getExtendLoanCoreInstruction } from '../generated/instructions/extendLoanCore';
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

export interface ExtendLoanParams {
  /** Borrower wallet (signer) */
  borrower: TransactionSigner;
  /** Current loan address to extend */
  loan: Address;
  /** New loan keypair (will be created) */
  newLoan: TransactionSigner;
  /** Current lender address */
  lender: Address;
  /** New lender address (can be same as current lender) */
  newLender: Address;
  /** OrderBook address */
  orderBook: Address;
  /** Fee authority address */
  feeAuthority: Address;
  /** NFT collateral mint */
  collateralMint: Address;
  /** NFT standard */
  nftStandard: NftStandard;
  /** Value token mint. Default: native SOL */
  valueMint?: Address;
  /** Core NFT collection (required for 'core' standard) */
  collection?: Address;
  /** Override program address */
  programId?: Address;
}

/**
 * Build an extend instruction, routing to V3 or Core.
 */
export async function createExtendInstruction(params: ExtendLoanParams) {
  const {
    borrower,
    loan,
    newLoan,
    lender,
    newLender,
    orderBook,
    feeAuthority,
    collateralMint,
    nftStandard,
    valueMint = NATIVE_MINT,
    collection,
    programId = SHARKY_PROGRAM_ADDRESS,
  } = params;

  if (nftStandard === 'core') {
    return createExtend_Core(borrower, loan, newLoan, lender, newLender, orderBook, feeAuthority, collateralMint, valueMint, programId, collection);
  }

  return createExtend_V3(borrower, loan, newLoan, lender, newLender, orderBook, feeAuthority, collateralMint, valueMint, programId);
}

async function createExtend_V3(
  borrower: TransactionSigner,
  loan: Address,
  newLoan: TransactionSigner,
  lender: Address,
  newLender: Address,
  orderBook: Address,
  feeAuthority: Address,
  collateralMint: Address,
  valueMint: Address,
  programId: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);
  const [newEscrow] = await findEscrowAddress(newLoan.address, programId);
  const [borrowerCollateralTokenAccount] = await findAssociatedTokenAddress(borrower.address, collateralMint);
  const [escrowCollateralTokenAccount] = await findAssociatedTokenAddress(escrow, collateralMint);
  const [newEscrowCollateralTokenAccount] = await findAssociatedTokenAddress(newEscrow, collateralMint);
  const [metadata] = await findMetadataAddress(collateralMint);
  const [edition] = await findEditionAddress(collateralMint);

  return getExtendLoanV3Instruction({
    loan,
    newLoan: newLoan.address,
    borrower,
    borrowerCollateralTokenAccount,
    lender,
    newLender,
    escrow,
    escrowCollateralTokenAccount,
    newEscrow,
    newEscrowCollateralTokenAccount,
    valueMint,
    collateralMint,
    orderBook,
    feeAuthority,
    metadata,
    edition,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    mplTokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    expectedLoan: '',
  }, { programAddress: programId });
}

async function createExtend_Core(
  borrower: TransactionSigner,
  loan: Address,
  newLoan: TransactionSigner,
  lender: Address,
  newLender: Address,
  orderBook: Address,
  feeAuthority: Address,
  collateralMint: Address,
  valueMint: Address,
  programId: Address,
  collection?: Address,
) {
  const [escrow] = await findEscrowAddress(loan, programId);
  const [newEscrow] = await findEscrowAddress(newLoan.address, programId);

  return getExtendLoanCoreInstruction({
    loan,
    newLoan: newLoan.address,
    borrower,
    lender,
    newLender,
    escrow,
    newEscrow,
    valueMint,
    collateralMint,
    orderBook,
    feeAuthority,
    collection: collection ?? undefined,
    mplCoreProgram: MPL_CORE_PROGRAM_ID as Address,
    expectedLoan: '',
  }, { programAddress: programId });
}
