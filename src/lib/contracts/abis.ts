export const groupRegistryAbi = [
  {
    type: 'function',
    name: 'createGroup',
    inputs: [{ name: 'initialMembers', type: 'address[]' }],
    outputs: [{ name: 'groupId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addMember',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'GroupCreated',
    inputs: [
      { name: 'groupId', type: 'uint256', indexed: true },
      { name: 'admin', type: 'address', indexed: true },
    ],
  },
] as const

export const confidentialLedgerAbi = [
  {
    type: 'function',
    name: 'recordExpense',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'participants', type: 'address[]' },
      { name: 'encTotal', type: 'bytes32' },
      { name: 'encShares', type: 'bytes32[]' },
      { name: 'inputProof', type: 'bytes' },
    ],
    outputs: [{ name: 'expenseId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'nextExpenseId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paidOf',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owedOf',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'expenseTotal',
    inputs: [{ name: 'expenseId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'expenseParticipantCount',
    inputs: [{ name: 'expenseId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'expenseParticipantAt',
    inputs: [
      { name: 'expenseId', type: 'uint256' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'expenseShareOf',
    inputs: [
      { name: 'expenseId', type: 'uint256' },
      { name: 'participant', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isShareSettled',
    inputs: [
      { name: 'expenseId', type: 'uint256' },
      { name: 'participant', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ExpenseRecorded',
    inputs: [
      { name: 'groupId', type: 'uint256', indexed: true },
      { name: 'expenseId', type: 'uint256', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
    ],
  },
] as const
