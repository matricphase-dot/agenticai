import { ethers } from 'ethers';
import { AGNT_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS } from './config';

const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');

const tokenABI = ['function balanceOf(address) view returns (uint256)'];
const stakingABI = [
  'function stakes(address, bytes32) view returns (uint256 amount, uint256 stakedAt, uint256 lockPeriod, bool unstaking, uint256 unstakeRequestedAt)',
  'function pendingRewards(address) view returns (uint256)'
];

export async function getTokenBalance(address: string): Promise<string> {
  if (!address || address === '') return '0.0';
  try {
    const contract = new ethers.Contract(AGNT_TOKEN_ADDRESS, tokenABI, provider);
    const raw = await contract.balanceOf(address);
    return ethers.formatUnits(raw, 18);
  } catch (e) {
    console.error("Web3 Balance Error:", e);
    return '0.0';
  }
}

export async function getPendingOnChainRewards(address: string): Promise<string> {
  if (!address || address === '') return '0.0';
  try {
    const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingABI, provider);
    const raw = await contract.pendingRewards(address);
    return ethers.formatUnits(raw, 18);
  } catch (e) {
    return '0.0';
  }
}
