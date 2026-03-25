# rw-sharky-sdk

Modern, lightweight SDK for the [Sharky.fi](https://sharky.fi) NFT lending protocol on Solana.

Built with [Codama](https://github.com/codama-idl/codama) + [@solana/kit](https://www.npmjs.com/package/@solana/kit). Fully typed, tree-shakeable, ESM native. Zero runtime dependencies.

## Install

```bash
npm install rw-sharky-sdk @solana/kit
```

## Quick Start

```typescript
import { createSolanaRpc } from '@solana/kit';
import { fetchLoan, fetchOrderBook } from 'rw-sharky-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');

// Fetch a loan
const loan = await fetchLoan(rpc, 'LoanAddressHere...');
console.log(loan.data.principalLamports); // bigint

// Fetch an order book
const orderBook = await fetchOrderBook(rpc, 'OrderBookAddressHere...');
console.log(orderBook.data.apy); // { __kind: 'Fixed', apy: 45000 }
```

## Bulk Fetching (getProgramAccounts)

```typescript
import {
  fetchAllLoans, fetchLoansByOrderBook, fetchOffersByLender,
  fetchAllOrderBooks,
} from 'rw-sharky-sdk';

// All loans on the platform (warning: can be thousands)
const allLoans = await fetchAllLoans(rpc);

// Loans for a specific collection's orderbook
const collectionLoans = await fetchLoansByOrderBook(rpc, orderBookAddress);

// My active offers as a lender
const myOffers = await fetchOffersByLender(rpc, myWalletAddress);

// All order books
const orderBooks = await fetchAllOrderBooks(rpc);
```

## Loan Inspection

```typescript
import {
  getLoan, isForeclosable, getLoanTimeRemaining,
  isOffer, isTaken, getPrincipalSol, getTotalOwedSol,
  getLender, getCollateralMint,
} from 'rw-sharky-sdk';

const loan = await getLoan(rpc, address);

isOffer(loan.data);                    // true if waiting for borrower
isTaken(loan.data);                    // true if active loan
isForeclosable(loan.data);             // true if expired
getLoanTimeRemaining(loan.data);       // ms until expiry
getPrincipalSol(loan.data);            // 5.0 (SOL)
getTotalOwedSol(loan.data);            // 5.25 (SOL)
getLender(loan.data);                  // lender wallet address
getCollateralMint(loan.data);          // NFT mint address
```

## OrderBook Inspection

```typescript
import {
  getOrderBook, getOrderBookApy, getOrderBookFee,
  getOrderBookDuration, getCollectionKey, getCollectionName,
} from 'rw-sharky-sdk';

const ob = await getOrderBook(rpc, address);

getOrderBookApy(ob.data);             // 45 (percent)
getOrderBookFee(ob.data);             // 1.0 (percent)
getOrderBookDuration(ob.data);        // 604800 (seconds, 7 days)
getCollectionKey(ob.data);            // collection address
getCollectionName(address);           // "Mad Lads" (from 301 enabled collections)
```

## High-Level Transaction Builders

All builders auto-resolve PDAs, escrows, ATAs, metadata, and editions. You only provide the essential params.

### Lender: Place an Offer

```typescript
import { createOfferInstruction } from 'rw-sharky-sdk';

const ix = await createOfferInstruction({
  lender: walletSigner,
  orderBook: orderBookAddress,
  loan: loanKeypairSigner,
  principalLamports: 5_000_000_000n,  // 5 SOL
});
```

### Lender: Rescind an Offer

```typescript
import { createRescindInstruction } from 'rw-sharky-sdk';

const ix = await createRescindInstruction({
  lender: walletSigner,
  loan: loanAddress,
});
```

### Borrower: Take a Loan

```typescript
import { createTakeInstruction } from 'rw-sharky-sdk';

const ix = await createTakeInstruction({
  borrower: walletSigner,
  loan: loanAddress,
  lender: lenderAddress,
  orderBook: orderBookAddress,
  collateralMint: nftMintAddress,
  nftStandard: 'legacy',  // 'legacy' | 'pnft' | 'core'
});
```

### Borrower: Repay a Loan

```typescript
import { createRepayInstruction } from 'rw-sharky-sdk';

const ix = await createRepayInstruction({
  borrower: walletSigner,
  loan: loanAddress,
  lender: lenderAddress,
  orderBook: orderBookAddress,
  feeAuthority: feeAuthorityAddress,
  collateralMint: nftMintAddress,
  nftStandard: 'legacy',
});
```

### Lender: Foreclose an Expired Loan

```typescript
import { createForecloseInstruction } from 'rw-sharky-sdk';

const ix = await createForecloseInstruction({
  lender: walletSigner,
  loan: loanAddress,
  borrower: borrowerAddress,
  collateralMint: nftMintAddress,
  nftStandard: 'legacy',  // auto-routes to V3 or Core instruction
});
```

### Borrower: Extend a Loan

```typescript
import { createExtendInstruction } from 'rw-sharky-sdk';

const ix = await createExtendInstruction({
  borrower: walletSigner,
  loan: currentLoanAddress,
  newLoan: newLoanKeypairSigner,
  lender: currentLenderAddress,
  newLender: newLenderAddress,
  orderBook: orderBookAddress,
  feeAuthority: feeAuthorityAddress,
  collateralMint: nftMintAddress,
  nftStandard: 'legacy',  // V3 and Core supported
});
```

## Transaction Execution

```typescript
import { buildAndSendTransaction, createComputeBudgetInstructions } from 'rw-sharky-sdk';

// Send with automatic retry, priority fees, and confirmation polling
const result = await buildAndSendTransaction(rpc, walletSigner, [ix], {
  priorityFee: 60_000,        // micro-lamports per compute unit
  computeUnitLimit: 1_000_000,
  maxRetries: 3,
  onStatusChange: (status) => console.log(status),
  // status: 'building' → 'signing' → 'sending' → 'confirming' → 'confirmed'
});

if (result.status === 'confirmed') {
  console.log('Tx:', result.signature);
}
```

## PDA Derivation

```typescript
import {
  findEscrowAddress,
  findMetadataAddress,
  findEditionAddress,
  findTokenRecordAddress,
  findAssociatedTokenAddress,
  findRuleSetAddress,
} from 'rw-sharky-sdk';

const [escrow, bump] = await findEscrowAddress(loanPubkey, programId);
const [metadata] = await findMetadataAddress(nftMint);
const [edition] = await findEditionAddress(nftMint);
const [tokenRecord] = await findTokenRecordAddress(nftMint, tokenAccount);
const [ata] = await findAssociatedTokenAddress(owner, mint);
```

## pNFT Support

```typescript
import { getRemainingAccountsForPNftV3 } from 'rw-sharky-sdk';

// Get extra accounts needed for pNFT transactions
const remainingAccounts = await getRemainingAccountsForPNftV3(
  nftMint,
  ownerTokenAccount,
  destinationTokenAccount,
  ruleSetAddress,  // optional
);
```

## Utilities

```typescript
import {
  // APR/APY (on-chain values are APR in thousandths of %)
  rawApyToPercent,     // 10000 → 10.0%
  percentToRawApy,     // 10.0% → 10000
  aprToApy,            // 10% APR → 10.52% APY
  apyToApr,            // 10.52% APY → 10% APR

  // Fees & interest
  calculateFee,        // (lamports, feePermillicentage) → fee
  calculateInterest,   // (principal, aprRaw, durationSec) → interest
  feeToPercent,        // 1000 → 1.0%

  // Constants
  SHARKY_PROGRAM_ID,
  SHARKY_FEE_AUTHORITY,
  DEFAULT_PRIORITY_FEE,
  COMPUTE_UNIT_LIMIT,
} from 'rw-sharky-sdk';
```

## Architecture

```
src/
  generated/          # Codama auto-generated (DO NOT EDIT)
    accounts/         # 9 account types (Loan, OrderBook, etc.)
    instructions/     # 30 instruction builders
    types/            # 11 type definitions
    errors/           # 42 program error codes
    programs/         # Program address + identifiers
  client/             # High-level helpers
    loans.ts          # Loan inspection (10 functions)
    orderbooks.ts     # OrderBook inspection (6 functions + 301 enabled names)
    offers.ts         # Create/rescind offers (2 functions)
    take.ts           # Take loans — V3 + Core (1 function)
    repay.ts          # Repay loans — V3 + Core (1 function)
    foreclose.ts      # Foreclose loans — V3 + Core (1 function)
    extend.ts         # Extend loans — V3 + Core (1 function)
  utils/
    pdas.ts           # PDA derivation (6 functions)
    pnft.ts           # pNFT remaining accounts
    transactions.ts   # Tx build, sign, send, confirm, retry
    rates.ts          # APR/APY conversion (6 functions)
    fees.ts           # Fee calculations (3 functions)
  data/
    orderbook-names.json  # 301 enabled collection mappings
  constants.ts        # Program IDs, wallets, defaults
```

## NFT Standard Support

| Standard | Take | Repay | Foreclose | Extend |
|----------|------|-------|-----------|--------|
| Legacy/pNFT (V3) | Yes | Yes | Yes | Yes |
| Core (Metaplex Core) | Yes | Yes | Yes | Yes |
| cNFT (Compressed) | Generated* | Generated* | Generated* | Generated* |

*cNFT instructions are available in the generated code but no high-level wrapper yet. cNFTs require escrow (double tx fees) and Merkle proofs — use with caution.

## Development

```bash
npm run build      # Build with tsup
npm run test       # Run tests (vitest)
npm run test:run   # Run tests once
npm run lint       # Type check (tsc --noEmit)
npm run codama     # Regenerate from IDL
```

## Notes

- **APY values on-chain are actually APR**, stored as u32 in thousandths of a percent (10000 = 10.000%)
- **Token lending** has been shut down by the Sharky team — generated instructions exist but are inactive
- **cNFT support** is present in generated code but complex (escrow-only, double tx fees) — deferred per Sharky team recommendation
- **OrderBook → Collection mapping** is static (301 enabled collections out of 776 total); refresh from https://sharky.fi/beta/orderbooks/nfts

## License

MIT
