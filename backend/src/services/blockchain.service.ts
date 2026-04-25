import { ethers } from "ethers";
import logger from "../lib/logger";
import { 
  AgenticTokenABI, 
  AgentStakingABI, 
  AgentGovernanceABI, 
  NodeRewardsABI 
} from "../lib/abis";

const TOKEN_ADDRESS = process.env.AGNT_TOKEN_ADDRESS;
const STAKING_ADDRESS = process.env.STAKING_CONTRACT_ADDRESS;
const GOVERNANCE_ADDRESS = process.env.GOVERNANCE_CONTRACT_ADDRESS;
const NODE_REWARDS_ADDRESS = process.env.NODE_REWARDS_CONTRACT_ADDRESS;
const TREASURY_ADDRESS = process.env.TREASURY_CONTRACT_ADDRESS;
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com';

export class BlockchainService {
  private provider: ethers.FallbackProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    const providers = [
      new ethers.JsonRpcProvider(RPC_URL),
      new ethers.JsonRpcProvider("https://polygon-rpc.com"), // Public fallback
    ].filter(p => !!p);

    this.provider = new ethers.FallbackProvider(providers, 1);

    if (process.env.BACKEND_WALLET_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(process.env.BACKEND_WALLET_PRIVATE_KEY, this.provider);
    }

    this.checkConfig();
  }

  private checkConfig() {
    if (!TOKEN_ADDRESS) logger.warn('AGNT_TOKEN_ADDRESS not set — blockchain features disabled');
    if (!STAKING_ADDRESS) logger.warn('STAKING_CONTRACT_ADDRESS not set');
    if (!GOVERNANCE_ADDRESS) logger.warn('GOVERNANCE_CONTRACT_ADDRESS not set');
    if (!this.wallet) logger.warn('BACKEND_WALLET_PRIVATE_KEY not set — cannot perform writes');
  }

  public isBlockchainEnabled(): boolean {
    return Boolean(TOKEN_ADDRESS && STAKING_ADDRESS && GOVERNANCE_ADDRESS && this.wallet);
  }

  async getTokenBalance(address: string): Promise<string> {
    if (!TOKEN_ADDRESS) return "0";
    try {
      const contract = new ethers.Contract(TOKEN_ADDRESS, AgenticTokenABI, this.provider);
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (err) {
      logger.error("Blockchain balance fetch failed:", err);
      return "0";
    }
  }

  async getStakedBalance(address: string, agentId: string): Promise<string> {
    if (!STAKING_ADDRESS) return "0";
    try {
      const contract = new ethers.Contract(STAKING_ADDRESS, AgentStakingABI, this.provider);
      const agentBytes32 = agentId.startsWith('0x') ? agentId : ethers.id(agentId); 
      const stake = await contract.stakes(address, agentBytes32);
      // Based on AgentStaking.sol, pos.amount is the first field (index 0)
      return ethers.formatEther(stake[0]);
    } catch (err) {
      logger.error("Blockchain stake fetch failed:", err);
      return "0";
    }
  }

  async getPendingRewards(address: string, agentId: string): Promise<string> {
    if (!STAKING_ADDRESS) return "0";
    try {
      const contract = new ethers.Contract(STAKING_ADDRESS, AgentStakingABI, this.provider);
      const agentBytes32 = agentId.startsWith('0x') ? agentId : ethers.id(agentId); 
      const reward = await contract.earned(address, agentBytes32);
      return ethers.formatEther(reward);
    } catch (err) {
      logger.error("Blockchain rewards fetch failed:", err);
      return "0";
    }
  }

  // Event listeners for DB sync
  listenToEvents() {
    if (!this.isBlockchainEnabled()) return;
    logger.info("Listening for blockchain events...");
    // Implementation for event syncing would go here
  }
}

export const blockchainService = new BlockchainService();
