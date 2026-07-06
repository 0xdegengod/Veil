import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.ts'
import { normalizeAddress } from './normalize.ts'

const encoder = new TextEncoder()
const secret = encoder.encode(env.JWT_SECRET)

export type SessionClaims = {
  sub: string
}

export async function issueSession(walletAddress: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(normalizeAddress(walletAddress))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secret)
  if (!payload.sub) throw new Error('invalid_session')
  return { sub: normalizeAddress(payload.sub) }
}
