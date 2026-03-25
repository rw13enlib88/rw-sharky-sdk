/**
 * OrderBook helpers — fetch, inspect, and scan Sharky order books
 */

import {
  type Address,
  type Account,
  type Rpc,
  type GetAccountInfoApi,
  type GetMultipleAccountsApi,
  type GetProgramAccountsApi,
} from '@solana/kit';
import {
  fetchOrderBook,
  fetchMaybeOrderBook,
  decodeOrderBook,
  ORDER_BOOK_DISCRIMINATOR,
  type OrderBook,
} from '../generated/accounts/orderBook';
import { SHARKY_PROGRAM_ADDRESS } from '../generated/programs/sharky';
import { rawApyToPercent } from '../utils/rates';
import { feeToPercent } from '../utils/fees';
import orderBookNamesJson from '../data/orderbook-names.json' with { type: 'json' };

type RpcRead = Rpc<GetAccountInfoApi & GetMultipleAccountsApi>;
type RpcScan = Rpc<GetProgramAccountsApi>;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

const OB_DISC_B64 = toBase64(ORDER_BOOK_DISCRIMINATOR);

/** Fetch a single order book by address */
export async function getOrderBook(rpc: RpcRead, address: Address) {
  return fetchOrderBook(rpc, address);
}

/** Fetch an order book, returns null if not found */
export async function getMaybeOrderBook(rpc: RpcRead, address: Address) {
  return fetchMaybeOrderBook(rpc, address);
}

/**
 * Fetch ALL order book accounts from the Sharky program.
 */
export async function fetchAllOrderBooks(
  rpc: RpcScan,
  programId: Address = SHARKY_PROGRAM_ADDRESS,
): Promise<Account<OrderBook>[]> {
  const result = await rpc.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [
      { memcmp: { offset: 0n, bytes: OB_DISC_B64 as any, encoding: 'base64' } },
    ],
  }).send();

  return result.map(({ pubkey, account }: any) =>
    decodeOrderBook({ address: pubkey, ...account })
  );
}

// ====== Inspection helpers ======

/** Get the APY as a readable percent */
export function getOrderBookApy(orderBook: OrderBook): number {
  return rawApyToPercent(orderBook.apy.apy);
}

/** Get the fee as a readable percent */
export function getOrderBookFee(orderBook: OrderBook): number {
  return feeToPercent(orderBook.feePermillicentage);
}

/** Get the loan duration in seconds, if fixed */
export function getOrderBookDuration(orderBook: OrderBook): number | null {
  if (orderBook.loanTerms.__kind === 'Fixed') {
    const spec = orderBook.loanTerms.terms;
    if (spec.__kind === 'Time') {
      return Number(spec.duration);
    }
  }
  return null;
}

/** Get the collection key from an order book */
export function getCollectionKey(orderBook: OrderBook): Address | null {
  if (orderBook.orderBookType.__kind === 'Collection') {
    return orderBook.orderBookType.collectionKey;
  }
  return null;
}

/**
 * Mapping of ENABLED orderBook pubkey -> collection name.
 * 301 active collections filtered from @sharkyfi/client v7 (776 total, 475 disabled).
 */
export const ORDER_BOOK_NAMES: Record<string, string> = orderBookNamesJson;

/** Resolve an orderBook address to a collection name */
export function getCollectionName(orderBookAddress: string): string | undefined {
  return ORDER_BOOK_NAMES[orderBookAddress];
}
