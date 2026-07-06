import { addGroupMember } from '../api/groups.ts'
import { addMemberOnChain } from '../contracts/actions/addMember.ts'
import type { Member } from '../../types/contracts.ts'

export type AddGroupMemberInput = {
  groupId: string
  member: Member
  chainId?: number
  chainGroupId?: number | null
}

export async function addGroupMemberFlow(input: AddGroupMemberInput): Promise<void> {
  if (!input.chainId || input.chainGroupId == null) {
    throw new Error('group_not_on_chain')
  }

  await addMemberOnChain(
    input.chainId,
    input.chainGroupId,
    input.member.address as `0x${string}`,
  )

  await addGroupMember(input.groupId, {
    walletAddress: input.member.address,
    handle: input.member.handle,
    trustTier: input.member.trustTier,
  })
}
