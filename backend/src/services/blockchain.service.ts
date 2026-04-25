import { ethers } from "ethers";
import logger from "../lib/logger";

const AGNT_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)"
];

const STAKING_ABI = [
  "function stakes(address, bytes32) view returns (uint256, uint256, uint256, bool, uint256)",
  "function pendingRewards(address) view returns (uint256)",
  "function stake(bytes32, uint256) returns (bool)",
  "function claimRewards() returns (bool)"
];

export class BlockchainService {
  private provider: ethers.FallbackProvider;
  private wallet: ethers.Wallet;

  constructor() {
    const providers = [
      new ethers.JsonRpcProvider(process.env.ALCHEMY_POLYGON_URL || process.env.BLOCKCHAIN_RPC_URL),
      new ethers.JsonRpcProvider(process.env.QUICKNODE_POLYGON_URL),
      new ethers.JsonRpcProvider("https://polygon-rpc.com"), // Public fallback
    ].filter(p => !!p);

    // quorum: 1 means first response wins. 2 for sensitive writes (future).
    this.provider = new ethers.FallbackProvider(providers, 1);
    this.wallet = new ethers.Wallet(process.env.BACKEND_WALLET_PRIVATE_KEY!, this.provider);
  }

  async getTokenBalance(address: string) {
    try {
      const contract = new ethers.Contract(process.env.AGNT_TOKEN_ADDRESS!, AGNT_TOKEN_ABI, this.provider);
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (err) {
      logger.error("Blockchain balance fetch failed:", err);
      return "0";
    }
  }

  async getStakedBalance(address: string, agentId: string) {
    try {
      const contract = new ethers.Contract(process.env.STAKING_CONTRACT_ADDRESS!, STAKING_ABI, this.provider);
      // agentId must be converted to bytes32 if it's a string ID
      const agentBytes32 = ethers.id(agentId); 
      const stake = await contract.stakes(address, agentBytes32);
      return ethers.formatEther(stake[0]);
    } catch (err) {
      logger.error("Blockchain stake fetch failed:", err);
      return "0";
    }
  }

  async getPendingRewards(address: string) {
    try {
      const contract = new ethers.Contract(process.env.STAKING_CONTRACT_ADDRESS!, STAKING_ABI, this.provider);
      const rewards = await contract.pendingRewards(address);
      return ethers.formatEther(rewards);
    } catch (err) {
      logger.error("Blockchain rewards fetch failed:", err);
      return "0";
    }
  }

  // Event listeners would be initialized here to sync on-chain actions to DB
  listenToEvents() {
    logger.info("Listening for blockchain events...");
    // contract.on("Staked", (user, agentId, amount) => { ... })
  }
}

export const blockchainService = new BlockchainService();
