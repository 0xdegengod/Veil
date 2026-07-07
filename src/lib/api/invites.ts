import { apiFetch } from './client.ts'

export type InvitePreview = {
  token: string
  groupId: string
  groupName: string
  inviterAddress: string
  inviterHandle?: string
}

export async function fetchInvitePreview(token: string): Promise<InvitePreview> {
  return apiFetch<InvitePreview>(`/invites/${token}`)
}

export async function acceptInvite(token: string): Promise<{ groupId: string; groupName: string }> {
  return apiFetch(`/invites/${token}/accept`, { method: 'POST' })
}
