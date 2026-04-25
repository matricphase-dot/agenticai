// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title NodeRewards
 * @dev Manages rewards and reputation for decentralized compute nodes.
 * Implements Merkle Tree based reward claims for scalability.
 */
contract NodeRewards is ReentrancyGuard, AccessControl {
    bytes32 public constant TASK_MANAGER_ROLE = keccak256("TASK_MANAGER_ROLE");
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");

    IERC20 public immutable agntToken;

    struct NodeInfo {
        address operator;
        uint256 reputation;
        uint256 totalClaimed;
        bool active;
    }

    mapping(bytes32 => NodeInfo) public nodes;
    mapping(address => bytes32) public addressToNodeId;
    
    // Merkle root of the cumulative rewards. Updated periodically by the system.
    bytes32 public rewardRoot;
    // nodeId => cumulativeAmount already claimed
    mapping(bytes32 => uint256) public claimedAmounts;

    event NodeRegistered(bytes32 indexed nodeId, address indexed operator);
    event RewardRootUpdated(bytes32 indexed newRoot);
    event RewardsClaimed(bytes32 indexed nodeId, address indexed operator, uint256 amount);
    event NodeSlashed(bytes32 indexed nodeId, uint256 amount);

    constructor(address _agntToken) {
        agntToken = IERC20(_agntToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerNode(bytes32 nodeId) external {
        require(!nodes[nodeId].active, "NodeRewards: already registered");
        require(addressToNodeId[msg.sender] == bytes32(0), "NodeRewards: operator already has a node");

        nodes[nodeId] = NodeInfo({
            operator: msg.sender,
            reputation: 50,
            totalClaimed: 0,
            active: true
        });
        addressToNodeId[msg.sender] = nodeId;

        emit NodeRegistered(nodeId, msg.sender);
    }

    /**
     * @dev Updates the Merkle root for cumulative rewards.
     * @param _rewardRoot The new Merkle root.
     */
    function updateRewardRoot(bytes32 _rewardRoot) external onlyRole(TASK_MANAGER_ROLE) {
        rewardRoot = _rewardRoot;
        emit RewardRootUpdated(_rewardRoot);
    }

    /**
     * @dev Claims rewards using a Merkle proof.
     * @param nodeId The ID of the node claiming rewards.
     * @param cumulativeAmount The total amount of rewards earned by this node to date.
     * @param merkleProof Merkle proof validating the claim.
     */
    function claimReward(
        bytes32 nodeId,
        uint256 cumulativeAmount,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        require(nodes[nodeId].active, "NodeRewards: node not active");
        require(nodes[nodeId].operator == msg.sender, "NodeRewards: not the operator");

        // Verify the merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(nodeId, cumulativeAmount));
        require(MerkleProof.verify(merkleProof, rewardRoot, leaf), "NodeRewards: invalid proof");

        uint256 claimable = cumulativeAmount - claimedAmounts[nodeId];
        require(claimable > 0, "NodeRewards: nothing to claim");

        claimedAmounts[nodeId] = cumulativeAmount;
        nodes[nodeId].totalClaimed += claimable;

        agntToken.transfer(msg.sender, claimable);

        emit RewardsClaimed(nodeId, msg.sender, claimable);
    }

    function slashNode(bytes32 nodeId, uint256 penalty) external onlyRole(SLASHER_ROLE) {
        require(nodes[nodeId].active, "NodeRewards: node not active");
        // Slashing in a Merkle-based system usually involves reducing the cumulativeAmount 
        // in the next Merkle root update off-chain. 
        // Here we just emit an event for the off-chain system to process.
        emit NodeSlashed(nodeId, penalty);
    }

    function updateReputation(bytes32 nodeId, uint256 score) external onlyRole(TASK_MANAGER_ROLE) {
        require(nodes[nodeId].active, "NodeRewards: node not active");
        require(score <= 100, "NodeRewards: invalid score");
        nodes[nodeId].reputation = score;
    }
}
