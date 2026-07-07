import { bytesToHex } from 'viem'
import { getFhevmInstance } from './instance.ts'

export type EncryptedTransferInput = {
  encryptedAmount: `0x${string}`
  inputProof: `0x${string}`
}

function toBytes32(handle: Uint8Array): `0x${string}` {
  return bytesToHex(handle, { size: 32 })
}

/** Encrypt a USDC amount (6-decimal units) for confidentialTransfer on an ERC-7984 wrapper. */
export async function encryptTransferAmount(
  wrapperAddress: `0x${string}`,
  senderAddress: `0x${string}`,
  amountUnits: bigint,
): Promise<EncryptedTransferInput> {
  if (amountUnits <= 0n) throw new Error('payment_amount_invalid')

  const fhe = await getFhevmInstance()
  const buffer = fhe.createEncryptedInput(wrapperAddress, senderAddress)
  buffer.add64(amountUnits)

  const { handles, inputProof } = await buffer.encrypt()
  if (handles.length !== 1) throw new Error('fhe_encrypt_handle_count_mismatch')

  return {
    encryptedAmount: toBytes32(handles[0]!),
    inputProof: bytesToHex(inputProof),
  }
}
