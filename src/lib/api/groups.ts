import type { Group, Member } from '../../types/contracts.ts'
import { sortByLatestOptional } from '../utils/sort.ts'
import { apiFetch } from './client.ts'

type ApiGroup = {
  id: string
  name: string
  description?: string | null
  inviteToken: string
  adminAddress: string
  adminHandle?: string | null
  chainGroupId: number | null
  createdAt: string
  memberCount: number
}

type ApiGroupDetail = {
  group: ApiGroup & { description?: string | null }
  members: {
    groupId: string
    walletAddress: string
    handle: string
    trustTier: string
    joinedAt: string
  }[]
}

export function mapApiGroup(row: ApiGroup): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    memberCount: row.memberCount,
    inviteToken: row.inviteToken,
    adminAddress: row.adminAddress,
    adminHandle: row.adminHandle ?? undefined,
    chainGroupId: row.chainGroupId,
    createdAt: row.createdAt,
  }
}

export function mapApiMember(row: ApiGroupDetail['members'][number]): Member {
  return {
    address: row.walletAddress,
    handle: row.handle,
    trustTier: row.trustTier as Member['trustTier'],
  }
}

export async function listGroups(): Promise<Group[]> {
  const rows = await apiFetch<ApiGroup[]>('/groups')
  return sortByLatestOptional(rows.map(mapApiGroup))
}

export async function getGroup(groupId: string): Promise<{ group: Group; members: Member[] }> {
  const data = await apiFetch<ApiGroupDetail>(`/groups/${groupId}`)
  const members = data.members.map(mapApiMember)
  const adminMember = members.find(
    (m) => m.address.toLowerCase() === data.group.adminAddress.toLowerCase(),
  )
  return {
    group: {
      ...mapApiGroup(data.group),
      adminHandle: adminMember?.handle ?? mapApiGroup(data.group).adminHandle,
    },
    members,
  }
}

export type CreateGroupInput = {
  name: string
  description?: string
  chainGroupId: number
  members: { walletAddress: string; handle: string; trustTier?: Member['trustTier'] }[]
}

export async function createGroup(input: CreateGroupInput): Promise<{
  group: Group
  members: Member[]
  inviteToken: string
}> {
  const data = await apiFetch<ApiGroupDetail>('/groups', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return {
    group: mapApiGroup(data.group),
    members: data.members.map(mapApiMember),
    inviteToken: data.group.inviteToken,
  }
}

export async function addGroupMember(
  groupId: string,
  member: { walletAddress: string; handle: string; trustTier?: Member['trustTier'] },
): Promise<void> {
  await apiFetch(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: member.walletAddress,
      handle: member.handle,
      trustTier: member.trustTier ?? 'medium',
    }),
  })
}

export async function renameGroup(groupId: string, name: string): Promise<void> {
  await apiFetch(`/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export async function removeGroupMember(groupId: string, wallet: string): Promise<void> {
  await apiFetch(`/groups/${groupId}/members/${wallet}`, { method: 'DELETE' })
}

export async function transferGroupAdmin(
  groupId: string,
  adminAddress: string,
): Promise<void> {
  await apiFetch(`/groups/${groupId}/admin`, {
    method: 'PATCH',
    body: JSON.stringify({ adminAddress }),
  })
}

export async function leaveGroup(groupId: string): Promise<void> {
  await apiFetch(`/groups/${groupId}/leave`, { method: 'POST' })
}
