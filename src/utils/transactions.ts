/**
 * Transaction execution utilities.
 *
 * Build, sign, send, confirm, and retry Solana transactions
 * with priority fee support and compute budget management.
 */

import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signAndSendTransactionMessageWithSigners,
  type Rpc,
  type TransactionSigner,
  type GetLatestBlockhashApi,
  type SendTransactionApi,
  type GetSignatureStatusesApi,
  type Instruction,
} from '@solana/kit';
import { DEFAULT_PRIORITY_FEE, COMPUTE_UNIT_LIMIT } from '../constants';

export type TransactionStatus = 'building' | 'signing' | 'sending' | 'confirming' | 'confirmed' | 'error';

export interface TransactionResult {
  signature: string;
  status: 'confirmed' | 'error';
  error?: string;
}

export interface SendTransactionOptions {
  /** Priority fee in micro-lamports per compute unit. Default: 60,000 */
  priorityFee?: number;
  /** Compute unit limit. Default: 1,000,000 */
  computeUnitLimit?: number;
  /** Max retry attempts. Default: 3 */
  maxRetries?: number;
  /** Callback for status updates */
  onStatusChange?: (status: TransactionStatus) => void;
}

/**
 * Create compute budget instructions for priority fees and compute limit.
 */
export function createComputeBudgetInstructions(
  priorityFee: number = DEFAULT_PRIORITY_FEE,
  computeUnitLimit: number = COMPUTE_UNIT_LIMIT,
): Instruction[] {
  // ComputeBudget: SetComputeUnitLimit (instruction index 2)
  const setComputeUnitLimit: Instruction = {
    programAddress: 'ComputeBudget111111111111111111111111111111' as any,
    data: new Uint8Array([
      2, // instruction index
      computeUnitLimit & 0xff,
      (computeUnitLimit >> 8) & 0xff,
      (computeUnitLimit >> 16) & 0xff,
      (computeUnitLimit >> 24) & 0xff,
    ]),
    accounts: [],
  };

  // ComputeBudget: SetComputeUnitPrice (instruction index 3)
  const priorityFeeBigInt = BigInt(priorityFee);
  const setComputeUnitPrice: Instruction = {
    programAddress: 'ComputeBudget111111111111111111111111111111' as any,
    data: new Uint8Array([
      3, // instruction index
      Number(priorityFeeBigInt & 0xffn),
      Number((priorityFeeBigInt >> 8n) & 0xffn),
      Number((priorityFeeBigInt >> 16n) & 0xffn),
      Number((priorityFeeBigInt >> 24n) & 0xffn),
      Number((priorityFeeBigInt >> 32n) & 0xffn),
      Number((priorityFeeBigInt >> 40n) & 0xffn),
      Number((priorityFeeBigInt >> 48n) & 0xffn),
      Number((priorityFeeBigInt >> 56n) & 0xffn),
    ]),
    accounts: [],
  };

  return [setComputeUnitLimit, setComputeUnitPrice];
}

/**
 * Poll for transaction confirmation by checking signature status.
 */
async function waitForConfirmation(
  rpc: Rpc<GetSignatureStatusesApi>,
  signature: string,
  timeoutMs: number = 30_000,
  pollIntervalMs: number = 1_000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const { value: statuses } = await rpc.getSignatureStatuses([signature as any]).send();
    const status = statuses[0];

    if (status) {
      if (status.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      }
      if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
        return;
      }
    }

    await new Promise(r => setTimeout(r, pollIntervalMs));
  }

  throw new Error('Transaction confirmation timeout');
}

/**
 * Build, sign, send, and confirm a transaction from instructions.
 *
 * Automatically adds compute budget instructions (priority fees, compute limit)
 * and waits for on-chain confirmation before returning.
 */
export async function buildAndSendTransaction(
  rpc: Rpc<GetLatestBlockhashApi & SendTransactionApi & GetSignatureStatusesApi>,
  feePayer: TransactionSigner,
  instructions: Instruction[],
  options: SendTransactionOptions = {},
): Promise<TransactionResult> {
  const {
    priorityFee = DEFAULT_PRIORITY_FEE,
    computeUnitLimit = COMPUTE_UNIT_LIMIT,
    maxRetries = 3,
    onStatusChange,
  } = options;

  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      onStatusChange?.('building');

      // Get fresh blockhash for each attempt
      const { value: blockhash } = await rpc.getLatestBlockhash().send();

      // Prepend compute budget instructions
      const computeInstructions = createComputeBudgetInstructions(priorityFee, computeUnitLimit);
      const allInstructions = [...computeInstructions, ...instructions];

      const message = pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayer(feePayer.address, m),
        m => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
        m => appendTransactionMessageInstructions(allInstructions, m),
      );

      onStatusChange?.('signing');
      onStatusChange?.('sending');

      // Sign and send
      const signature = await signAndSendTransactionMessageWithSigners(message);
      const signatureStr = String(signature);

      onStatusChange?.('confirming');

      // Wait for on-chain confirmation
      await waitForConfirmation(rpc, signatureStr);

      onStatusChange?.('confirmed');
      return { signature: signatureStr, status: 'confirmed' };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 3s...
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  onStatusChange?.('error');
  return { signature: '', status: 'error', error: lastError };
}
