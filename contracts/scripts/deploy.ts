import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy AgenticToken
  const AgenticToken = await ethers.getContractFactory("AgenticToken");
  const token = await AgenticToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("AgenticToken deployed to:", tokenAddress);

  // 2. Deploy AgentStaking
  const AgentStaking = await ethers.getContractFactory("AgentStaking");
  const staking = await AgentStaking.deploy(tokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("AgentStaking deployed to:", stakingAddress);

  // 3. Deploy NodeRewards
  const NodeRewards = await ethers.getContractFactory("NodeRewards");
  const nodeRewards = await NodeRewards.deploy(tokenAddress);
  await nodeRewards.waitForDeployment();
  const nodeRewardsAddress = await nodeRewards.getAddress();
  console.log("NodeRewards deployed to:", nodeRewardsAddress);

  // 4. Deploy Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(tokenAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  // 5. Deploy AgentGovernance
  const AgentGovernance = await ethers.getContractFactory("AgentGovernance");
  const governance = await AgentGovernance.deploy(tokenAddress, stakingAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("AgentGovernance deployed to:", governanceAddress);

  // --- Configuration ---

  // Grant DISTRIBUTOR_ROLE to deployer (or specialized backend address) for Staking
  const DISTRIBUTOR_ROLE = await staking.DISTRIBUTOR_ROLE();
  await staking.grantRole(DISTRIBUTOR_ROLE, deployer.address);
  console.log("Granted DISTRIBUTOR_ROLE to deployer");

  // Grant TASK_MANAGER_ROLE to deployer for NodeRewards
  const TASK_MANAGER_ROLE = await nodeRewards.TASK_MANAGER_ROLE();
  await nodeRewards.grantRole(TASK_MANAGER_ROLE, deployer.address);
  console.log("Granted TASK_MANAGER_ROLE to deployer");

  // Grant GOVERNANCE_ROLE to the Governance contract for the Treasury
  const GOVERNANCE_ROLE = await treasury.GOVERNANCE_ROLE();
  await treasury.grantRole(GOVERNANCE_ROLE, governanceAddress);
  console.log("Granted GOVERNANCE_ROLE to Governance contract at", governanceAddress);

  console.log("Deployment complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
