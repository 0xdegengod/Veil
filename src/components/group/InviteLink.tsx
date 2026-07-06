type InviteLinkProps = {
  inviteUrl: string
  groupName: string
  onCopy: () => void
  onShareTwitter: () => void
}

export function InviteLink({
  inviteUrl,
  groupName,
  onCopy,
  onShareTwitter,
}: InviteLinkProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-left">
      <p className="text-sm text-locked">Invite to {groupName}</p>
      <p className="mt-2 break-all font-mono text-xs tabular-nums text-locked">
        {inviteUrl}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg bg-accent px-4 py-2 text-sm hover:bg-accent-hover"
        >
          Copy invite link
        </button>
        <button
          type="button"
          onClick={onShareTwitter}
          className="rounded-lg border border-border px-4 py-2 text-sm text-locked"
        >
          Invite via Twitter
        </button>
      </div>
    </div>
  )
}
