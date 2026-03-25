import { describe, it, expect } from 'vitest';
import { getRemainingAccountsForPNftV3, AccountRole } from '../src/utils/pnft';

// Valid base58 Solana addresses for testing (real format, 32+ chars)
const MOCK_MINT = '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' as any;
const MOCK_OWNER_TOKEN = '8EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' as any;
const MOCK_DEST_TOKEN = '9EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' as any;
const MOCK_RULE_SET = 'AEYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' as any;

describe('pNFT helpers', () => {
  it('AccountRole constants are correct', () => {
    expect(AccountRole.Readonly).toBe(0);
    expect(AccountRole.Writable).toBe(1);
  });

  it('getRemainingAccountsForPNftV3 returns 5 accounts without ruleSet', async () => {
    const accounts = await getRemainingAccountsForPNftV3(
      MOCK_MINT,
      MOCK_OWNER_TOKEN,
      MOCK_DEST_TOKEN,
    );

    // metadata, edition, ownerTokenRecord, destTokenRecord, tokenMetadataProgram
    expect(accounts).toHaveLength(5);
  });

  it('getRemainingAccountsForPNftV3 returns 7 accounts with ruleSet', async () => {
    const accounts = await getRemainingAccountsForPNftV3(
      MOCK_MINT,
      MOCK_OWNER_TOKEN,
      MOCK_DEST_TOKEN,
      MOCK_RULE_SET,
    );

    // + authRulesProgram, ruleSet
    expect(accounts).toHaveLength(7);
  });

  it('getRemainingAccountsForPNftV3 uses correct roles', async () => {
    const accounts = await getRemainingAccountsForPNftV3(
      MOCK_MINT,
      MOCK_OWNER_TOKEN,
      MOCK_DEST_TOKEN,
    );

    expect(accounts[0].role).toBe(AccountRole.Writable);  // metadata
    expect(accounts[1].role).toBe(AccountRole.Readonly);   // edition
    expect(accounts[2].role).toBe(AccountRole.Writable);   // ownerTokenRecord
    expect(accounts[3].role).toBe(AccountRole.Writable);   // destTokenRecord
    expect(accounts[4].role).toBe(AccountRole.Readonly);   // tokenMetadataProgram
  });
});
