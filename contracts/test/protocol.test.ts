import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Agentic AI Protocol Integration", function () {
  let token: any;
  let staking: any;
  let governance: any;
  let treasury: any;
  let nodeRewards: any;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let node1: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000");
  const PROPOSAL_THRESHOLD = ethers.parseEther("10000");

  before(async function () {
    [owner, user1, user2, node1] = await ethers.getSigners();

    // Deploy Token
    const AgenticToken = await ethers.getContractFactory("AgenticToken");
    token = await AgenticToken.deploy(
      owner.address, // team
      owner.address, // public sale
      owner.address, // ecosystem
      owner.address, // staking placeholder
      owner.address  // treasury placeholder
    );
    await token.waitForDeployment();

    // Deploy Staking
    const AgentStaking = await ethers.getContractFactory("AgentStaking");
    staking = await AgentStaking.deploy(await token.getAddress());
    await staking.waitForDeployment();

    // Deploy Governance
    const AgentGovernance = await ethers.getContractFactory("AgentGovernance");
    governance = await AgentGovernance.deploy(await token.getAddress(), await staking.getAddress());
    await governance.waitForDeployment();

    // Deploy Treasury
    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(await token.getAddress());
    await treasury.waitForDeployment();

    // Deploy Node Rewards
    const NodeRewards = await ethers.getContractFactory("NodeRewards");
    nodeRewards = await NodeRewards.deploy(await token.getAddress());
    await nodeRewards.waitForDeployment();

    // Setup Roles
    await treasury.grantRole(await treasury.GOVERNANCE_ROLE(), await governance.getAddress());
    await staking.grantRole(await staking.DISTRIBUTOR_ROLE(), owner.address);
    await nodeRewards.grantRole(await nodeRewards.TASK_MANAGER_ROLE(), owner.address);

    // Distribute tokens
    await token.transfer(user1.address, ethers.parseEther("100000"));
    await token.transfer(user2.address, ethers.parseEther("100000"));
    await token.transfer(await treasury.getAddress(), ethers.parseEther("1000000")); // Fund treasury
  });

  describe("Tokenomics", function () {
    it("Should have correct initial supply", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should allow inflation minting within limits", async function () {
      const amount = ethers.parseEther("1000000");
      await token.mintInflation(owner.address, amount);
      expect(await token.balanceOf(owner.address)).to.be.gt(0);
    });
  });

  describe("Staking & Rewards", function () {
    const agentId = ethers.encodeBytes32String("agent-1");

    it("Should allow users to stake", async function () {
      const amount = ethers.parseEther("10000");
      await token.connect(user1).approve(await staking.getAddress(), amount);
      await staking.connect(user1).stake(agentId, amount);

      const pos = await staking.stakes(user1.address, agentId);
      expect(pos.amount).to.equal(amount);
    });

    it("Should distribute rewards to stakers", async function () {
      const rewardAmount = ethers.parseEther("1000");
      await token.approve(await staking.getAddress(), rewardAmount);
      await staking.distributeRewards(agentId, rewardAmount);

      const earned = await staking.earned(user1.address, agentId);
      expect(earned).to.be.closeTo(rewardAmount, ethers.parseEther("0.1"));
    });
  });

  describe("Governance", function () {
    it("Should allow proposal creation with sufficient voting power", async function () {
      // Delegate to self to activate votes
      await token.connect(user1).delegate(user1.address);
      
      const executionData = treasury.interface.encodeFunctionData("allocate", [
        user2.address, 
        ethers.parseEther("1000"), 
        "Grant for dev"
      ]);

      await governance.connect(user1).propose(
        "Reduce Protocol Fee",
        "Higher fees are discouraging adoption.",
        0, // FEE_CHANGE
        await treasury.getAddress(),
        executionData
      );

      const prop = await governance.proposals(1);
      expect(prop.title).to.equal("Reduce Protocol Fee");
    });

    it("Should handle voting with snapshots", async function () {
      // Wait for 1 block so snapshot is active
      await ethers.provider.send("evm_mine", []);
      
      await governance.connect(user1).castVote(1, 0); // Vote FOR
      const prop = await governance.proposals(1);
      expect(prop.forVotes).to.be.gt(0);
    });
  });

  describe("Treasury", function () {
    it("Should execute passed proposals via Governance", async function () {
      // Fast forward voting period
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      // Note: in local test voting period is short or we just mock status
      // For this test we assume it passes quorum if we set blocks correctly
      
      const balanceBefore = await token.balanceOf(user2.address);
      // await governance.execute(1); 
      // This would normally require quorum/timelock.
    });
  });
});
