// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AgentStaking
 * @dev Scalable staking rewards for AI Agents. 
 * Implements the reward-per-token pattern for efficient distribution.
 */
contract AgentStaking is ReentrancyGuard, AccessControl {
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    IERC20 public immutable agntToken;

    struct StakePosition {
        uint256 amount;
        uint256 stakedAt;
        uint256 lockPeriod;
        bool unstaking;
        uint256 unstakeRequestedAt;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
    }

    // agentId => rewardPerTokenStored
    mapping(bytes32 => uint256) public rewardPerTokenStored;
    // user => agentId => StakePosition
    mapping(address => mapping(bytes32 => StakePosition)) public stakes;
    // agentId => totalStaked
    mapping(bytes32 => uint256) public agentTotalStaked;

    uint256 public constant MIN_STAKE = 10 * 10**18;
    uint256 public constant DEFAULT_LOCK_PERIOD = 7 days;

    event Staked(address indexed user, bytes32 indexed agentId, uint256 amount);
    event UnstakeRequested(address indexed user, bytes32 indexed agentId);
    event Unstaked(address indexed user, bytes32 indexed agentId, uint256 amount);
    event RewardsDistributed(bytes32 indexed agentId, uint256 totalReward);
    event RewardsClaimed(address indexed user, bytes32 indexed agentId, uint256 amount);

    constructor(address _agntToken) {
        agntToken = IERC20(_agntToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier updateReward(address account, bytes32 agentId) {
        StakePosition storage pos = stakes[account][agentId];
        pos.rewards = earned(account, agentId);
        pos.rewardPerTokenPaid = rewardPerTokenStored[agentId];
        _;
    }

    function rewardPerToken(bytes32 agentId) public view returns (uint256) {
        return rewardPerTokenStored[agentId];
    }

    function earned(address account, bytes32 agentId) public view returns (uint256) {
        StakePosition storage pos = stakes[account][agentId];
        return (pos.amount * (rewardPerToken(agentId) - pos.rewardPerTokenPaid) / 1e18) + pos.rewards;
    }

    function stake(bytes32 agentId, uint256 amount) external nonReentrant updateReward(msg.sender, agentId) {
        require(amount >= MIN_STAKE, "AgentStaking: amount below minimum");
        
        StakePosition storage pos = stakes[msg.sender][agentId];
        require(!pos.unstaking, "AgentStaking: currently unstaking");

        agntToken.transferFrom(msg.sender, address(this), amount);

        pos.amount += amount;
        pos.stakedAt = block.timestamp;
        pos.lockPeriod = DEFAULT_LOCK_PERIOD;

        agentTotalStaked[agentId] += amount;

        emit Staked(msg.sender, agentId, amount);
    }

    function requestUnstake(bytes32 agentId) external updateReward(msg.sender, agentId) {
        StakePosition storage pos = stakes[msg.sender][agentId];
        require(pos.amount > 0, "AgentStaking: no stake found");
        require(!pos.unstaking, "AgentStaking: already unstaking");

        pos.unstaking = true;
        pos.unstakeRequestedAt = block.timestamp;

        emit UnstakeRequested(msg.sender, agentId);
    }

    function claimUnstake(bytes32 agentId) external nonReentrant updateReward(msg.sender, agentId) {
        StakePosition storage pos = stakes[msg.sender][agentId];
        require(pos.unstaking, "AgentStaking: not unstaking");
        require(block.timestamp >= pos.unstakeRequestedAt + pos.lockPeriod, "AgentStaking: still locked");

        uint256 amount = pos.amount;
        pos.amount = 0;
        pos.unstaking = false;

        agentTotalStaked[agentId] -= amount;

        agntToken.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, agentId, amount);
    }

    /**
     * @dev Distributes rewards to stakers of a specific agent.
     * @param agentId The ID of the agent whose stakers receive rewards.
     * @param totalReward Total amount of AGNT to distribute.
     */
    function distributeRewards(bytes32 agentId, uint256 totalReward) external onlyRole(DISTRIBUTOR_ROLE) {
        require(agentTotalStaked[agentId] > 0, "AgentStaking: no stakers");
        
        agntToken.transferFrom(msg.sender, address(this), totalReward);
        rewardPerTokenStored[agentId] += (totalReward * 1e18) / agentTotalStaked[agentId];
        
        emit RewardsDistributed(agentId, totalReward);
    }

    function claimRewards(bytes32 agentId) public nonReentrant updateReward(msg.sender, agentId) {
        StakePosition storage pos = stakes[msg.sender][agentId];
        uint256 reward = pos.rewards;
        require(reward > 0, "AgentStaking: no rewards to claim");

        pos.rewards = 0;
        agntToken.transfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, agentId, reward);
    }
}
