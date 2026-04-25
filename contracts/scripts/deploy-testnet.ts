import { ethers, run } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Starting Agentic AI Platform Deployment...");

  const [deployer] = await ethers.getSigners();
  console.log(`📡 Deploying contracts with the account: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} MATIC`);

  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️ Warning: Low balance. Deployment might fail.");
  }

  // 1. Deploy AGNT Token
  console.log("\n📦 Deploying AGNT Token...");
  const AGNTToken = await ethers.getContractFactory("AgenticToken");
  const initialSupply = ethers.parseEther("100000000"); // 100M AGNT
  const token = await AGNTToken.deploy(initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ AGNT Token deployed to: ${tokenAddress}`);

  // 2. Deploy Treasury
  console.log("\n🏦 Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(tokenAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`✅ Treasury deployed to: ${treasuryAddress}`);

  // 3. Deploy Staking Contract
  console.log("\n🥩 Deploying AgentStaking...");
  const Staking = await ethers.getContractFactory("AgentStaking");
  const staking = await Staking.deploy(tokenAddress, treasuryAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`✅ AgentStaking deployed to: ${stakingAddress}`);

  // 4. Deploy Governance
  console.log("\n⚖️ Deploying AgentGovernance...");
  const Governance = await ethers.getContractFactory("AgentGovernance");
  const governance = await Governance.deploy(tokenAddress, stakingAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log(`✅ AgentGovernance deployed to: ${governanceAddress}`);

  // 5. Deploy NodeRewards
  console.log("\n🎁 Deploying NodeRewards...");
  const NodeRewards = await ethers.getContractFactory("NodeRewards");
  const nodeRewards = await NodeRewards.deploy(tokenAddress, treasuryAddress);
  await nodeRewards.waitForDeployment();
  const nodeRewardsAddress = await nodeRewards.getAddress();
  console.log(`✅ NodeRewards deployed to: ${nodeRewardsAddress}`);

  console.log("\n✨ Verification starts in 30 seconds...");
  if (process.env.ETHERSCAN_API_KEY) {
    // Wait for Etherscan to index
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await run("verify:verify", { address: tokenAddress, constructorArguments: [initialSupply] });
      await run("verify:verify", { address: treasuryAddress, constructorArguments: [tokenAddress] });
      await run("verify:verify", { address: stakingAddress, constructorArguments: [tokenAddress, treasuryAddress] });
      await run("verify:verify", { address: governanceAddress, constructorArguments: [tokenAddress, stakingAddress] });
      await run("verify:verify", { address: nodeRewardsAddress, constructorArguments: [tokenAddress, treasuryAddress] });
      console.log("✅ All contracts verified on Polygonscan");
    } catch (err) {
      console.error("❌ Verification failed:", err);
    }
  }

  console.log("\n🎉 Deployment Complete!");
  console.log("-----------------------------------------");
  console.log(`AGNT_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`TREASURY_CONTRACT_ADDRESS=${treasuryAddress}`);
  console.log(`STAKING_CONTRACT_ADDRESS=${stakingAddress}`);
  console.log(`GOVERNANCE_CONTRACT_ADDRESS=${governanceAddress}`);
  console.log(`NODE_REWARDS_CONTRACT_ADDRESS=${nodeRewardsAddress}`);
  console.log("-----------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
