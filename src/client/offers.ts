/**
 * High-level offer management — place and rescind loan offers.
 *
 * These wrappers resolve all necessary accounts (escrow PDA,
 * token accounts, system programs) so the consumer only needs
 * to provide the essential parameters.
 */

import type { Address, TransactionSigner } from '@solana/kit';
import { getOfferLoanInstruction, type OfferLoanInput } from '../generated/instructions/offerLoan';
import { getRescindLoanInstruction } from '../generated/instructions/rescindLoan';
import { SHARKY_PROGRAM_ADDRESS } from '../generated/programs/sharky';
import { findEscrowAddress, findAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '../utils/pdas';

/** Native SOL mint (wrapped SOL) */
const NATIVE_MINT = 'So11111111111111111111111111111111111111112' as Address;

export interface CreateOfferParams {
  /** Lender wallet (signer) */
  lender: TransactionSigner;
  /** OrderBook address to offer into */
  orderBook: Address;
  /** Loan keypair (new account, signer) */
  loan: TransactionSigner;
  /** Amount to lend in lamports */
  principalLamports: bigint;
  /** Optional: specific loan terms. Null = use orderbook defaults */
  termsChoice?: { __kind: 'Time'; duration: bigint } | null;
  /** Value token mint. Default: native SOL (wrapped) */
  valueMint?: Address;
  /** Override program address (default: production) */
  programId?: Address;
}

/**
 * Build an offerLoan instruction with all accounts resolved.
 *
 * Resolves: escrow PDA, escrow token account, lender value token account.
 */
export async function createOfferInstruction(params: CreateOfferParams) {
  const {
    lender,
    orderBook,
    loan,
    principalLamports,
    termsChoice = null,
    valueMint = NATIVE_MINT,
    programId = SHARKY_PROGRAM_ADDRESS,
  } = params;

  // Validate inputs
  if (principalLamports <= 0n) {
    throw new Error('principalLamports must be positive');
  }
  if (termsChoice && termsChoice.duration <= 0n) {
    throw new Error('termsChoice.duration must be positive');
  }

  // Derive escrow PDA from loan pubkey
  const [escrow, escrowBump] = await findEscrowAddress(loan.address, programId);

  // Derive token accounts
  const [escrowTokenAccount] = await findAssociatedTokenAddress(escrow, valueMint);
  const [lenderValueTokenAccount] = await findAssociatedTokenAddress(lender.address, valueMint);

  const input: OfferLoanInput = {
    lender,
    lenderValueTokenAccount,
    valueMint,
    loan,
    escrow,
    escrowTokenAccount,
    orderBook,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    escrowBump,
    principalLamports,
    termsChoice: termsChoice ? { __kind: 'Time', duration: termsChoice.duration } : null,
  };

  return getOfferLoanInstruction(input, { programAddress: programId });
}

export interface RescindOfferParams {
  /** Lender wallet (signer) */
  lender: TransactionSigner;
  /** Loan account address to rescind */
  loan: Address;
  /** Value token mint. Default: native SOL */
  valueMint?: Address;
  /** Override program address */
  programId?: Address;
}

/**
 * Build a rescindLoan instruction with all accounts resolved.
 *
 * Resolves: escrow PDA, escrow token account, lender value token account.
 */
export async function createRescindInstruction(params: RescindOfferParams) {
  const {
    lender,
    loan,
    valueMint = NATIVE_MINT,
    programId = SHARKY_PROGRAM_ADDRESS,
  } = params;

  // Derive escrow PDA from loan pubkey
  const [escrow] = await findEscrowAddress(loan, programId);

  // Derive token accounts
  const [escrowTokenAccount] = await findAssociatedTokenAddress(escrow, valueMint);
  const [lenderValueTokenAccount] = await findAssociatedTokenAddress(lender.address, valueMint);

  return getRescindLoanInstruction({
    lender,
    loan,
    escrow,
    escrowTokenAccount,
    lenderValueTokenAccount,
    valueMint,
  }, { programAddress: programId });
}
