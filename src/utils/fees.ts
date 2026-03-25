/**
 * Fee calculation utilities
 *
 * feePermillicentage is a u16 stored on-chain representing
 * thousandths of a percent. Example: 1000 = 1.000%
 */

/** Calculate fee amount from principal and feePermillicentage */
export function calculateFee(principalLamports: bigint, feePermillicentage: number): bigint {
  return (principalLamports * BigInt(feePermillicentage)) / 100_000n;
}

/** Calculate total interest owed on a loan */
export function calculateInterest(
  principalLamports: bigint,
  aprRaw: number,
  durationSeconds: number
): bigint {
  const secondsInYear = 365.25 * 24 * 60 * 60;
  const rate = (aprRaw / 1000 / 100) * (durationSeconds / secondsInYear);
  return BigInt(Math.floor(Number(principalLamports) * rate));
}

/** Convert feePermillicentage to readable percent */
export function feeToPercent(feePermillicentage: number): number {
  return feePermillicentage / 1000;
}
