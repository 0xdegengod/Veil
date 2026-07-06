import { bytesToHex } from 'viem'
import { getFhevmInstance } from './instance.ts'

export type EncryptedExpenseInput = {
  encTotal: `0x${string}`
  encShares: `0x${string}`[]
  inputProof: `0x${string}`
}

function toBytes32(handle: Uint8Array): `0x${string}` {
  return bytesToHex(handle, { size: 32 })
}

/**
 * Encrypt expense total + per-participant shares for ConfidentialLedger.recordExpense.
 * One inputProof covers all handles (total first, then each share).
 */
export async function encryptExpenseAmounts(
  ledgerAddress: `0x${string}`,
  payerAddress: `0x${string}`,
  totalCents: number,
  shareCents: number[],
): Promise<EncryptedExpenseInput> {
  const fhe = await getFhevmInstance()
  const buffer = fhe.createEncryptedInput(ledgerAddress, payerAddress)
  buffer.add64(BigInt(totalCents))
  for (const cents of shareCents) {
    buffer.add64(BigInt(cents))
  }

  const { handles, inputProof } = await buffer.encrypt()
  if (handles.length !== shareCents.length + 1) {
    throw new Error('fhe_encrypt_handle_count_mismatch')
  }

  return {
    encTotal: toBytes32(handles[0]!),
    encShares: handles.slice(1).map(toBytes32),
    inputProof: bytesToHex(inputProof),
  }
}
