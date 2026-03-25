import { describe, it, expect } from 'vitest';
import { createOfferInstruction, createRescindInstruction } from '../src/client/offers';

// Valid base58 Solana addresses for testing
const MOCK_ADDR_1 = '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' as any;
const MOCK_ADDR_2 = '8EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' as any;
const MOCK_ADDR_3 = '9EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' as any;

function mockSigner(address: string) {
  return {
    address: address as any,
    keyPair: {} as any,
    signAndSendTransactions: async () => [],
  } as any;
}

describe('offer helpers', () => {
  it('createOfferInstruction validates positive principalLamports', async () => {
    const lender = mockSigner(MOCK_ADDR_1);
    const loan = mockSigner(MOCK_ADDR_2);

    await expect(
      createOfferInstruction({
        lender,
        orderBook: MOCK_ADDR_3,
        loan,
        principalLamports: 0n,
      })
    ).rejects.toThrow('principalLamports must be positive');

    await expect(
      createOfferInstruction({
        lender,
        orderBook: MOCK_ADDR_3,
        loan,
        principalLamports: -1n,
      })
    ).rejects.toThrow('principalLamports must be positive');
  });

  it('createOfferInstruction validates positive termsChoice.duration', async () => {
    const lender = mockSigner(MOCK_ADDR_1);
    const loan = mockSigner(MOCK_ADDR_2);

    await expect(
      createOfferInstruction({
        lender,
        orderBook: MOCK_ADDR_3,
        loan,
        principalLamports: 5_000_000_000n,
        termsChoice: { __kind: 'Time', duration: 0n },
      })
    ).rejects.toThrow('termsChoice.duration must be positive');
  });

  it('createRescindInstruction resolves accounts from loan address', async () => {
    const lender = mockSigner(MOCK_ADDR_1);
    const result = createRescindInstruction({
      lender,
      loan: MOCK_ADDR_2,
    });
    // Should resolve PDAs and return an instruction
    expect(result).toBeInstanceOf(Promise);
    const ix = await result;
    expect(ix.programAddress).toBeDefined();
  });
});
