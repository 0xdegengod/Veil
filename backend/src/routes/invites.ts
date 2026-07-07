import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/client.ts'
import { apiError } from '../lib/errors.ts'
import { normalizeAddress } from '../lib/normalize.ts'
import { sessionWallet } from '../middleware/session.ts'
import type { AppEnv } from '../types.ts'

/** Public invite preview (before SIWE). */
export const publicInvites = new Hono()

publicInvites.get('/:token', async (c) => {
  const token = c.req.param('token')

  const [invite] = await db
    .select()
    .from(schema.invites)
    .where(eq(schema.invites.token, token))
    .limit(1)

  if (!invite) return apiError(c, 'not_found', 404)

  const [group] = await db
    .select()
    .from(schema.groups)
    .where(eq(schema.groups.id, invite.groupId))
    .limit(1)

  if (!group) return apiError(c, 'not_found', 404)

  const [inviterProfile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.walletAddress, invite.inviterAddress))
    .limit(1)

  return c.json({
    token,
    groupId: group.id,
    groupName: group.name,
    inviterAddress: invite.inviterAddress,
    inviterHandle: inviterProfile?.handle ?? invite.inviterAddress,
  })
})

/** Authenticated invite acceptance. */
export const invites = new Hono<AppEnv>()

invites.post('/:token/accept', async (c) => {
  const token = c.req.param('token')
  const caller = sessionWallet(c)
  if (!caller) return apiError(c, 'unauthorized', 401)

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.walletAddress, caller))
    .limit(1)

  if (!profile) return apiError(c, 'forbidden', 403, { profile: 'required' })

  const [invite] = await db
    .select()
    .from(schema.invites)
    .where(eq(schema.invites.token, token))
    .limit(1)

  if (!invite) return apiError(c, 'not_found', 404)

  await db
    .insert(schema.groupMembers)
    .values({
      groupId: invite.groupId,
      walletAddress: caller,
      handle: profile.handle,
      trustTier: 'medium',
    })
    .onConflictDoNothing()

  const [group] = await db
    .select()
    .from(schema.groups)
    .where(eq(schema.groups.id, invite.groupId))
    .limit(1)

  if (!group) return apiError(c, 'not_found', 404)

  if (normalizeAddress(group.adminAddress) !== caller) {
    await db.insert(schema.notifications).values({
      recipientAddress: normalizeAddress(group.adminAddress),
      type: 'invite',
      message: `@${profile.handle} joined ${group.name} via invite link`,
      link: `/groups/${group.id}/settings`,
    })
  }

  return c.json({ groupId: group.id, groupName: group.name }, 201)
})
