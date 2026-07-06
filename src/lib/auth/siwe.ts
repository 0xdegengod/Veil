import { API_URL, SIWE_CHAIN_ID, SIWE_DOMAIN, SIWE_URI } from '../api/config.ts'
import { apiFetch } from '../api/client.ts'
import { clearSessionToken, setSessionToken } from './session.ts'
import type { Profile } from '../../types/api.ts'

type VerifyResponse = {
  token: string
  walletAddress: string
  hasProfile: boolean
  profile: Profile | null
}

export async function fetchAuthNonce(address: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/nonce?address=${encodeURIComponent(address)}`)
  } catch {
    throw new Error('api_unreachable')
  }
  if (!res.ok) throw new Error('nonce_failed')
  const data = (await res.json()) as { nonce: string }
  return data.nonce
}

/** EIP-4361 message — verified server-side with the `siwe` package. */
function buildSiweMessage(input: {
  domain: string
  address: string
  statement: string
  uri: string
  chainId: number
  nonce: string
}): string {
  const issuedAt = new Date().toISOString()
  return `${input.domain} wants you to sign in with your Ethereum account:
${input.address}

${input.statement}

URI: ${input.uri}
Version: 1
Chain ID: ${input.chainId}
Nonce: ${input.nonce}
Issued At: ${issuedAt}`
}

export async function verifySiwe(
  address: string,
  chainId: number,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<VerifyResponse> {
  const nonce = await fetchAuthNonce(address)

  const prepared = buildSiweMessage({
    domain: SIWE_DOMAIN,
    address,
    statement: 'Sign in to Veil',
    uri: SIWE_URI,
    chainId: chainId || SIWE_CHAIN_ID,
    nonce,
  })

  const signature = await signMessageAsync({ message: prepared })

  const data = await apiFetch<VerifyResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ message: prepared, signature }),
  })

  setSessionToken(data.token)
  return data
}

export async function fetchAuthMe(): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>('/auth/me')
}

export async function saveProfile(input: {
  displayName: string
  handle: string
}): Promise<Profile> {
  return apiFetch<Profile>('/profiles', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function signOut(): void {
  clearSessionToken()
}
