/**
 * Loan helpers — fetch, decode, inspect, and scan Sharky loans
 */

import {
  getAddressEncoder,
  type Address,
  type Account,
  type Rpc,
  type GetAccountInfoApi,
  type GetMultipleAccountsApi,
  type GetProgramAccountsApi,
} from '@solana/kit';
import {
  fetchLoan,
  fetchMaybeLoan,
  decodeLoan,
  LOAN_DISCRIMINATOR,
  type Loan,
} from '../generated/accounts/loan';
import { SHARKY_PROGRAM_ADDRESS } from '../generated/programs/sharky';
import { isLoanState } from '../generated/types/loanState';

type RpcRead = Rpc<GetAccountInfoApi & GetMultipleAccountsApi>;
type RpcScan = Rpc<GetProgramAccountsApi>;

/** Convert bytes to base64 string for memcmp filters */
function toBase64(bytes: Uint8Array | ArrayLike<number>): string {
  return Buffer.from(bytes as Uint8Array).toString('base64');
}

const LOAN_DISC_B64 = toBase64(LOAN_DISCRIMINATOR);
const addressEncoder = getAddressEncoder();

/** Fetch a single loan by address */
export async function getLoan(rpc: RpcRead, address: Address) {
  return fetchLoan(rpc, address);
}

/** Fetch a loan, returns null if not found */
export async function getMaybeLoan(rpc: RpcRead, address: Address) {
  return fetchMaybeLoan(rpc, address);
}

/**
 * Fetch ALL loan accounts from the Sharky program.
 * Uses getProgramAccounts with discriminator filter.
 *
 * Warning: can return thousands of accounts. Consider fetchLoansByOrderBook for filtered results.
 */
export async function fetchAllLoans(
  rpc: RpcScan,
  programId: Address = SHARKY_PROGRAM_ADDRESS,
): Promise<Account<Loan>[]> {
  const result = await rpc.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [
      { memcmp: { offset: 0n, bytes: LOAN_DISC_B64 as any, encoding: 'base64' } },
    ],
  }).send();

  return result.map(({ pubkey, account }: any) =>
    decodeLoan({ address: pubkey, ...account })
  );
}

/**
 * Fetch all loans for a specific orderBook.
 *
 * Layout: [discriminator:8][version:1][principalLamports:8][orderBook:32]
 * Offset of orderBook = 17
 */
export async function fetchLoansByOrderBook(
  rpc: RpcScan,
  orderBook: Address,
  programId: Address = SHARKY_PROGRAM_ADDRESS,
): Promise<Account<Loan>[]> {
  const orderBookBytes = toBase64(addressEncoder.encode(orderBook));

  const result = await rpc.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [
      { memcmp: { offset: 0n, bytes: LOAN_DISC_B64 as any, encoding: 'base64' } },
      { memcmp: { offset: 17n, bytes: orderBookBytes as any, encoding: 'base64' } },
    ],
  }).send();

  return result.map(({ pubkey, account }: any) =>
    decodeLoan({ address: pubkey, ...account })
  );
}

/**
 * Fetch all loan OFFERS by a specific lender wallet.
 *
 * Offset of loanState discriminator = 82 (0 = Offer)
 * Offset of lenderWallet = 83
 */
export async function fetchOffersByLender(
  rpc: RpcScan,
  lenderWallet: Address,
  programId: Address = SHARKY_PROGRAM_ADDRESS,
): Promise<Account<Loan>[]> {
  const lenderBytes = toBase64(addressEncoder.encode(lenderWallet));
  const offerDiscriminator = toBase64(new Uint8Array([0]));

  const result = await rpc.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [
      { memcmp: { offset: 0n, bytes: LOAN_DISC_B64 as any, encoding: 'base64' } },
      { memcmp: { offset: 82n, bytes: offerDiscriminator as any, encoding: 'base64' } },
      { memcmp: { offset: 83n, bytes: lenderBytes as any, encoding: 'base64' } },
    ],
  }).send();

  return result.map(({ pubkey, account }: any) =>
    decodeLoan({ address: pubkey, ...account })
  );
}

// ====== Inspection helpers ======

/** Check if a taken loan is past its expiry (foreclosable) */
export function isForeclosable(loan: Loan, now: number = Date.now()): boolean {
  if (!isLoanState('Taken', loan.loanState)) return false;
  const terms = loan.loanState.taken.terms;
  if (terms.__kind !== 'Time') return false;
  const expiryMs = (Number(terms.start) + Number(terms.duration)) * 1000;
  return now >= expiryMs;
}

/** Get time remaining until loan expiry in milliseconds */
export function getLoanTimeRemaining(loan: Loan, now: number = Date.now()): number {
  if (!isLoanState('Taken', loan.loanState)) return Infinity;
  const terms = loan.loanState.taken.terms;
  if (terms.__kind !== 'Time') return Infinity;
  const expiryMs = (Number(terms.start) + Number(terms.duration)) * 1000;
  return Math.max(0, expiryMs - now);
}

/** Check if loan is an offer (not yet taken) */
export function isOffer(loan: Loan): boolean {
  return isLoanState('Offer', loan.loanState);
}

/** Check if loan is taken (active) */
export function isTaken(loan: Loan): boolean {
  return isLoanState('Taken', loan.loanState);
}

/** Get the lender wallet from a loan offer */
export function getLender(loan: Loan): Address | null {
  if (isLoanState('Offer', loan.loanState)) {
    return loan.loanState.offer.lenderWallet;
  }
  return null;
}

/** Get the borrower's NFT collateral mint from a taken loan */
export function getCollateralMint(loan: Loan): Address | null {
  if (isLoanState('Taken', loan.loanState)) {
    return loan.loanState.taken.nftCollateralMint;
  }
  return null;
}

/** Get principal in SOL (from lamports) */
export function getPrincipalSol(loan: Loan): number {
  return Number(loan.principalLamports) / 1e9;
}

/** Get total owed in SOL for a taken loan */
export function getTotalOwedSol(loan: Loan): number | null {
  if (!isLoanState('Taken', loan.loanState)) return null;
  const terms = loan.loanState.taken.terms;
  if (terms.__kind !== 'Time') return null;
  return Number(terms.totalOwedLamports) / 1e9;
}
