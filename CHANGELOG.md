# Changelog

## 0.3.0 (2026-03-24)

### Added
- **Bulk fetch functions** using `getProgramAccounts`:
  - `fetchAllLoans(rpc)` — all loan accounts on the platform
  - `fetchLoansByOrderBook(rpc, orderBook)` — loans filtered by collection orderbook
  - `fetchOffersByLender(rpc, wallet)` — active offers for a specific lender
  - `fetchAllOrderBooks(rpc)` — all order book accounts
- All bulk fetchers use discriminator + memcmp filters for efficient RPC queries

## 0.2.0 (2026-03-24)

### Added
- **High-level wrappers** with auto-resolved accounts:
  - `createOfferInstruction` — place loan offers (lender)
  - `createRescindInstruction` — cancel loan offers (lender)
  - `createTakeInstruction` — take loans, V3 + Core (borrower)
  - `createRepayInstruction` — repay loans, V3 + Core (borrower)
  - `createForecloseInstruction` — foreclose expired loans, V3 + Core (lender)
  - `createExtendInstruction` — extend loans, V3 + Core (borrower)
- **PDA derivation helpers**: `findEscrowAddress`, `findMetadataAddress`, `findEditionAddress`, `findTokenRecordAddress`, `findAssociatedTokenAddress`, `findRuleSetAddress`
- **Transaction execution**: `buildAndSendTransaction` with compute budget, priority fees, confirmation polling, and exponential backoff retry
- `createComputeBudgetInstructions` for manual compute budget management
- **pNFT support**: `getRemainingAccountsForPNftV3` resolves metadata, edition, token records, and auth rules
- **OrderBook names**: 301 enabled collection mappings (filtered from 776 total)
- Input validation on offer creation (principalLamports > 0, duration > 0)
- `NftStandard` type ('legacy' | 'pnft' | 'core') for routing instructions
- Program ID constants for Metaplex, SPL Token, Associated Token, Auth Rules

### Fixed
- All tests now use valid base58 Solana addresses

## 0.1.0 (2026-03-24)

### Added
- Initial release
- Codama-generated client from Sharky IDL v7.0.0 (30 instructions, 9 accounts, 42 errors)
- Loan helpers: `isForeclosable`, `getLoanTimeRemaining`, `isOffer`, `isTaken`, `getPrincipalSol`, `getTotalOwedSol`, `getLender`, `getCollateralMint`
- OrderBook helpers: `getOrderBookApy`, `getOrderBookFee`, `getOrderBookDuration`, `getCollectionKey`, `getCollectionName`
- Rate utils: `rawApyToPercent`, `percentToRawApy`, `aprToApy`, `apyToApr`, `aprToInterestRatio`, `interestRatioToApr`
- Fee utils: `calculateFee`, `calculateInterest`, `feeToPercent`
- Constants: program IDs, authority wallets, compute defaults, loan versions
