import { describe, it, expect } from 'vitest';
import { createComputeBudgetInstructions } from '../src/utils/transactions';

describe('transaction utilities', () => {
  it('createComputeBudgetInstructions returns 2 instructions', () => {
    const instructions = createComputeBudgetInstructions();
    expect(instructions).toHaveLength(2);
  });

  it('createComputeBudgetInstructions uses correct program address', () => {
    const instructions = createComputeBudgetInstructions();
    expect(instructions[0].programAddress).toBe('ComputeBudget111111111111111111111111111111');
    expect(instructions[1].programAddress).toBe('ComputeBudget111111111111111111111111111111');
  });

  it('createComputeBudgetInstructions encodes SetComputeUnitLimit correctly', () => {
    const instructions = createComputeBudgetInstructions(60_000, 1_000_000);
    const data = instructions[0].data!;

    // Instruction index should be 2
    expect(data[0]).toBe(2);

    // Compute units should be 1_000_000 (little-endian u32)
    const computeUnits = data[1] | (data[2] << 8) | (data[3] << 16) | (data[4] << 24);
    expect(computeUnits).toBe(1_000_000);
  });

  it('createComputeBudgetInstructions encodes SetComputeUnitPrice correctly', () => {
    const instructions = createComputeBudgetInstructions(60_000, 1_000_000);
    const data = instructions[1].data!;

    // Instruction index should be 3
    expect(data[0]).toBe(3);

    // Priority fee should be 60_000 (little-endian u64)
    const fee = BigInt(data[1]) |
      (BigInt(data[2]) << 8n) |
      (BigInt(data[3]) << 16n) |
      (BigInt(data[4]) << 24n) |
      (BigInt(data[5]) << 32n) |
      (BigInt(data[6]) << 40n) |
      (BigInt(data[7]) << 48n) |
      (BigInt(data[8]) << 56n);
    expect(fee).toBe(60_000n);
  });

  it('createComputeBudgetInstructions uses custom values', () => {
    const instructions = createComputeBudgetInstructions(100_000, 500_000);

    // Check compute units
    const computeData = instructions[0].data!;
    const computeUnits = computeData[1] | (computeData[2] << 8) | (computeData[3] << 16) | (computeData[4] << 24);
    expect(computeUnits).toBe(500_000);

    // Check priority fee
    const feeData = instructions[1].data!;
    const fee = BigInt(feeData[1]) |
      (BigInt(feeData[2]) << 8n) |
      (BigInt(feeData[3]) << 16n) |
      (BigInt(feeData[4]) << 24n) |
      (BigInt(feeData[5]) << 32n) |
      (BigInt(feeData[6]) << 40n) |
      (BigInt(feeData[7]) << 48n) |
      (BigInt(feeData[8]) << 56n);
    expect(fee).toBe(100_000n);
  });
});
