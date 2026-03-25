/**
 * APR/APY conversion utilities
 *
 * IMPORTANT: The Sharky program stores "APY" values as APR
 * in thousandths of a percent (u32). Example: 10000 = 10.000% APR
 */

/** Convert raw on-chain APY value (thousandths of a percent) to a readable percent */
export function rawApyToPercent(rawApy: number): number {
  return rawApy / 1000;
}

/** Convert readable percent back to raw on-chain value */
export function percentToRawApy(percent: number): number {
  return Math.round(percent * 1000);
}

/** Convert APR (%) to APY (%) with continuous compounding */
export function aprToApy(aprPercent: number): number {
  return (Math.exp(aprPercent / 100) - 1) * 100;
}

/** Convert APY (%) to APR (%) */
export function apyToApr(apyPercent: number): number {
  return Math.log(1 + apyPercent / 100) * 100;
}

/** Convert APR (%) to interest ratio for a given duration */
export function aprToInterestRatio(aprPercent: number, durationSeconds: number): number {
  const secondsInYear = 365.25 * 24 * 60 * 60;
  return (aprPercent / 100) * (durationSeconds / secondsInYear);
}

/** Convert interest ratio back to APR (%) */
export function interestRatioToApr(interestRatio: number, durationSeconds: number): number {
  const secondsInYear = 365.25 * 24 * 60 * 60;
  return (interestRatio / (durationSeconds / secondsInYear)) * 100;
}
