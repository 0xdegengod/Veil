import { createGroup as createGroupApi, type CreateGroupInput } from '../api/groups.ts'
import { createGroupOnChain } from '../contracts/actions/createGroup.ts'
import type { Member } from '../../types/contracts.ts'

export type CreateGroupFlowInput = {
  chainId: number
  name: string
  description?: string
  members: Member[]
}

export async function createGroupFlow(input: CreateGroupFlowInput) {
  const memberAddresses = input.members.map((m) => m.address as `0x${string}`)

  const chainGroupId = await createGroupOnChain(input.chainId, memberAddresses)

  const apiInput: CreateGroupInput = {
    name: input.name,
    description: input.description,
    chainGroupId,
    members: input.members.map((m) => ({
      walletAddress: m.address,
      handle: m.handle,
      trustTier: m.trustTier,
    })),
  }

  return createGroupApi(apiInput)
}
