import { describe, it, expect } from 'vitest';
import { isForeclosable, getLoanTimeRemaining, isOffer, isTaken, getPrincipalSol, getTotalOwedSol } from '../src/client/loans';
import type { Loan } from '../src/generated/accounts/loan';

// Helper to create a mock loan
function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    discriminator: new Uint8Array([20, 195, 70, 117, 165, 227, 182, 1]),
    version: 3,
    principalLamports: 5_000_000_000n, // 5 SOL
    orderBook: 'orderBookAddr' as any,
    valueTokenMint: 'So11111111111111111111111111111111111111112' as any,
    escrowBumpSeed: 255,
    loanState: {
      __kind: 'Offer' as const,
      offer: {
        lenderWallet: 'lenderAddr' as any,
        termsSpec: { __kind: 'Time' as const, duration: 604800n },
        offerTime: BigInt(Math.floor(Date.now() / 1000)),
      },
    },
    ...overrides,
  };
}

function makeTakenLoan(startSec: number, durationSec: number): Loan {
  return makeLoan({
    loanState: {
      __kind: 'Taken' as const,
      taken: {
        nftCollateralMint: 'nftMint' as any,
        lenderNoteMint: 'lenderNote' as any,
        borrowerNoteMint: 'borrowerNote' as any,
        apy: { __kind: 'Fixed' as const, apy: 45000 },
        terms: {
          __kind: 'Time' as const,
          start: BigInt(startSec),
          duration: BigInt(durationSec),
          totalOwedLamports: 5_250_000_000n,
        },
        isCollateralFrozen: 1,
      },
    },
  });
}

describe('loan helpers', () => {
  it('identifies offers vs taken', () => {
    const offer = makeLoan();
    expect(isOffer(offer)).toBe(true);
    expect(isTaken(offer)).toBe(false);

    const taken = makeTakenLoan(1000000, 604800);
    expect(isOffer(taken)).toBe(false);
    expect(isTaken(taken)).toBe(true);
  });

  it('calculates principal in SOL', () => {
    const loan = makeLoan({ principalLamports: 12_500_000_000n });
    expect(getPrincipalSol(loan)).toBe(12.5);
  });

  it('calculates total owed in SOL for taken loans', () => {
    const taken = makeTakenLoan(1000000, 604800);
    expect(getTotalOwedSol(taken)).toBe(5.25);

    const offer = makeLoan();
    expect(getTotalOwedSol(offer)).toBeNull();
  });

  it('detects foreclosable loans (expired)', () => {
    const now = Date.now();
    const pastLoan = makeTakenLoan(
      Math.floor(now / 1000) - 1000, // started 1000s ago
      500, // duration 500s — expired 500s ago
    );
    expect(isForeclosable(pastLoan, now)).toBe(true);
  });

  it('detects non-foreclosable loans (not expired)', () => {
    const now = Date.now();
    const activeLoan = makeTakenLoan(
      Math.floor(now / 1000) - 100, // started 100s ago
      604800, // 7 days duration
    );
    expect(isForeclosable(activeLoan, now)).toBe(false);
  });

  it('offers are never foreclosable', () => {
    expect(isForeclosable(makeLoan())).toBe(false);
  });

  it('calculates time remaining', () => {
    const now = Date.now();
    const activeLoan = makeTakenLoan(
      Math.floor(now / 1000), // started now
      3600, // 1 hour
    );
    const remaining = getLoanTimeRemaining(activeLoan, now);
    expect(remaining).toBeGreaterThan(3599 * 1000);
    expect(remaining).toBeLessThanOrEqual(3600 * 1000);

    const expiredLoan = makeTakenLoan(
      Math.floor(now / 1000) - 7200,
      3600,
    );
    expect(getLoanTimeRemaining(expiredLoan, now)).toBe(0);
  });

  it('returns Infinity for offers', () => {
    expect(getLoanTimeRemaining(makeLoan())).toBe(Infinity);
  });
});
