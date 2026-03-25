import { describe, it, expect } from 'vitest';
import { rawApyToPercent, percentToRawApy, aprToApy, apyToApr, aprToInterestRatio } from '../src/utils/rates';

describe('rates', () => {
  it('converts raw on-chain APY to percent', () => {
    expect(rawApyToPercent(10000)).toBe(10.0);
    expect(rawApyToPercent(45000)).toBe(45.0);
    expect(rawApyToPercent(500)).toBe(0.5);
  });

  it('converts percent back to raw', () => {
    expect(percentToRawApy(10.0)).toBe(10000);
    expect(percentToRawApy(45.0)).toBe(45000);
  });

  it('converts APR to APY', () => {
    expect(aprToApy(10)).toBeCloseTo(10.52, 1);
    expect(aprToApy(50)).toBeCloseTo(64.87, 1);
    expect(aprToApy(0)).toBe(0);
  });

  it('converts APY to APR', () => {
    expect(apyToApr(10.52)).toBeCloseTo(10, 0);
    expect(apyToApr(0)).toBe(0);
  });

  it('round-trips APR -> APY -> APR', () => {
    const apr = 25;
    expect(apyToApr(aprToApy(apr))).toBeCloseTo(apr, 10);
  });

  it('calculates interest ratio for duration', () => {
    const oneYear = 365.25 * 24 * 60 * 60;
    expect(aprToInterestRatio(10, oneYear)).toBeCloseTo(0.1, 10);
    expect(aprToInterestRatio(10, oneYear / 2)).toBeCloseTo(0.05, 10);
  });
});
