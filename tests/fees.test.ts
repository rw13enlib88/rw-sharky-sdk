import { describe, it, expect } from 'vitest';
import { calculateFee, calculateInterest, feeToPercent } from '../src/utils/fees';

describe('fees', () => {
  it('calculates fee from permillicentage', () => {
    // 1 SOL (1e9 lamports) with 1% fee (1000 permillicentage)
    expect(calculateFee(1_000_000_000n, 1000)).toBe(10_000_000n);

    // 1 SOL with 0.1% fee (100 permillicentage)
    expect(calculateFee(1_000_000_000n, 100)).toBe(1_000_000n);

    // 10 SOL with 2.5% fee (2500 permillicentage)
    expect(calculateFee(10_000_000_000n, 2500)).toBe(250_000_000n);
  });

  it('returns 0 for 0 fee', () => {
    expect(calculateFee(1_000_000_000n, 0)).toBe(0n);
  });

  it('calculates interest for a loan', () => {
    const principal = 1_000_000_000n; // 1 SOL
    const apr = 10000; // 10% raw
    const oneYear = Math.round(365.25 * 24 * 60 * 60);

    const interest = calculateInterest(principal, apr, oneYear);
    // 10% of 1 SOL = 0.1 SOL = 100_000_000 lamports
    expect(Number(interest)).toBeCloseTo(100_000_000, -3);
  });

  it('converts feePermillicentage to percent', () => {
    expect(feeToPercent(1000)).toBe(1.0);
    expect(feeToPercent(2500)).toBe(2.5);
    expect(feeToPercent(100)).toBe(0.1);
  });
});
