import { describe, it, expect } from 'vitest';
import { getOrderBookApy, getOrderBookFee, getOrderBookDuration, getCollectionKey } from '../src/client/orderbooks';
import type { OrderBook } from '../src/generated/accounts/orderBook';

function makeOrderBook(overrides: Partial<OrderBook> = {}): OrderBook {
  return {
    discriminator: new Uint8Array([55, 230, 125, 218, 149, 39, 65, 248]),
    version: 3,
    orderBookType: {
      __kind: 'Collection' as const,
      collectionKey: 'collectionAddr' as any,
    },
    apy: { __kind: 'Fixed' as const, apy: 45000 },
    loanTerms: {
      __kind: 'Fixed' as const,
      terms: { __kind: 'Time' as const, duration: 604800n },
    },
    feePermillicentage: 1000,
    feeAuthority: 'feeAuthAddr' as any,
    ...overrides,
  };
}

describe('orderbook helpers', () => {
  it('gets APY as percent', () => {
    expect(getOrderBookApy(makeOrderBook())).toBe(45);
    expect(getOrderBookApy(makeOrderBook({ apy: { __kind: 'Fixed', apy: 10000 } }))).toBe(10);
  });

  it('gets fee as percent', () => {
    expect(getOrderBookFee(makeOrderBook())).toBe(1.0);
    expect(getOrderBookFee(makeOrderBook({ feePermillicentage: 2500 }))).toBe(2.5);
  });

  it('gets duration in seconds', () => {
    expect(getOrderBookDuration(makeOrderBook())).toBe(604800);
  });

  it('returns null duration for LenderChooses', () => {
    const ob = makeOrderBook({
      loanTerms: { __kind: 'LenderChooses' as any },
    });
    expect(getOrderBookDuration(ob)).toBeNull();
  });

  it('gets collection key', () => {
    const ob = makeOrderBook();
    expect(getCollectionKey(ob)).toBe('collectionAddr');
  });

  it('returns null collection key for NftList type', () => {
    const ob = makeOrderBook({
      orderBookType: { __kind: 'NftList' as any, listAccount: 'listAddr' as any },
    });
    expect(getCollectionKey(ob)).toBeNull();
  });
});
