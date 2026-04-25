import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'MATIC');

  const network = await ethers.provider.getNetwork();
  console.log('Network:', network.name, 'Chain ID:', network.chainId.toString());

  // 1. Deploy AgenticToken
  console.log('\n1. Deploying AgenticToken...');
  const AgenticToken = await ethers.getContractFactory('AgenticToken');
  // Allocation wallets — use deployer for all in testnet
  const agenticToken = await AgenticToken.deploy(
    deployer.address, // teamWallet
    deployer.address, // publicSaleWallet
    deployer.address, // ecosystemWallet
    deployer.address, // stakingContract placeholder — update after staking deploy
    deployer.address, // treasuryContract placeholder — update after treasury deploy
  );
  await agenticToken.waitForDeployment();
  const tokenAddress = await agenticToken.getAddress();
  console.log('AgenticToken deployed to:', tokenAddress);

  // 2. Deploy Treasury
  console.log('\n2. Deploying Treasury...');
  const Treasury = await ethers.getContractFactory('Treasury');
  const treasury = await Treasury.deploy(tokenAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log('Treasury deployed to:', treasuryAddress);

  // 3. Deploy AgentStaking
  console.log('\n3. Deploying AgentStaking...');
  const AgentStaking = await ethers.getContractFactory('AgentStaking');
  const agentStaking = await AgentStaking.deploy(tokenAddress);
  await agentStaking.waitForDeployment();
  const stakingAddress = await agentStaking.getAddress();
  console.log('AgentStaking deployed to:', stakingAddress);

  // 4. Deploy AgentGovernance
  console.log('\n4. Deploying AgentGovernance...');
  const AgentGovernance = await ethers.getContractFactory('AgentGovernance');
  const agentGovernance = await AgentGovernance.deploy(
    tokenAddress,
    stakingAddress,
  );
  await agentGovernance.waitForDeployment();
  const governanceAddress = await agentGovernance.getAddress();
  console.log('AgentGovernance deployed to:', governanceAddress);

  // 5. Deploy NodeRewards
  console.log('\n5. Deploying NodeRewards...');
  const NodeRewards = await ethers.getContractFactory('NodeRewards');
  const nodeRewards = await NodeRewards.deploy(tokenAddress);
  await nodeRewards.waitForDeployment();
  const nodeRewardsAddress = await nodeRewards.getAddress();
  console.log('NodeRewards deployed to:', nodeRewardsAddress);

  // Save deployment addresses
  const deployments = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      AgenticToken: tokenAddress,
      Treasury: treasuryAddress,
      AgentStaking: stakingAddress,
      AgentGovernance: governanceAddress,
      NodeRewards: nodeRewardsAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployments, null, 2)
  );

  // Also save as latest
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}-latest.json`),
    JSON.stringify(deployments, null, 2)
  );

  console.log('\n✅ All contracts deployed successfully');
  console.log('Addresses saved to deployments/' + filename);
  console.log('\nContract Addresses:');
  console.log(JSON.stringify(deployments.contracts, null, 2));

  console.log('\n📋 Add these to your backend .env:');
  console.log(`AGNT_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`STAKING_CONTRACT_ADDRESS=${stakingAddress}`);
  console.log(`GOVERNANCE_CONTRACT_ADDRESS=${governanceAddress}`);
  console.log(`NODE_REWARDS_CONTRACT_ADDRESS=${nodeRewardsAddress}`);
  console.log(`TREASURY_CONTRACT_ADDRESS=${treasuryAddress}`);
  console.log(`BLOCKCHAIN_CHAIN_ID=${network.chainId}`);
  console.log(`BLOCKCHAIN_RPC_URL=${process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
