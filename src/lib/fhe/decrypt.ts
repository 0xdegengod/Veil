import {
  isEncryptedBalanceHandle,
  type EncryptedBalanceHandles,
} from '../contracts/readLedger.ts'
import { centsForHandle, userDecryptHandles } from './userDecrypt.ts'

export async function revealBalance(encryptedHandle: unknown): Promise<number> {
  if (!isEncryptedBalanceHandle(encryptedHandle)) {
    throw new Error('balance_decrypt_not_configured')
  }

  return revealEncryptedBalance(encryptedHandle)
}

async function revealEncryptedBalance(handles: EncryptedBalanceHandles): Promise<number> {
  const pairs = [
    { handle: handles.paidHandle, contractAddress: handles.ledgerAddress },
    { handle: handles.owedHandle, contractAddress: handles.ledgerAddress },
  ]

  const decrypted = await userDecryptHandles(handles.chainId, pairs)
  const paid = centsForHandle(decrypted, handles.paidHandle)
  const owed = centsForHandle(decrypted, handles.owedHandle)
  return paid - owed
}
