export const CONTRACTS = {
  token: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '',
  staking: process.env.NEXT_PUBLIC_STAKING_ADDRESS || '',
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || '',
  nodeRewards: process.env.NEXT_PUBLIC_NODE_REWARDS_ADDRESS || '',
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 80001,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
};

export const isWeb3Enabled = () =>
  Boolean(CONTRACTS.token && CONTRACTS.staking && CONTRACTS.governance);
