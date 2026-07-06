export type Profile = {
  walletAddress: string
  handle: string
  displayName: string
  createdAt?: string
}

export type Notification = {
  id: string
  type: 'expense' | 'invite' | 'dispute'
  message: string
  read: boolean
  createdAt: string
  /** In-app route this notification links to (e.g. /groups/:id) */
  link?: string
}

export type Invite = {
  token: string
  groupId: string
  groupName: string
  inviterName: string
}
