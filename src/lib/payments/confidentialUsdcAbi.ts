export const confidentialUsdcWrapperAbi = [
  {
    type: 'function',
    name: 'wrap',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'confidentialTransfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    outputs: [{ name: 'transferred', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
] as const
