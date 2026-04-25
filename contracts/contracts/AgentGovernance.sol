// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "./AgentStaking.sol";

/**
 * @title AgentGovernance
 * @dev Governance contract for the Agentic AI platform.
 * Uses snapshot-based voting power from the AGNT token to prevent flash loan attacks.
 */
contract AgentGovernance is ReentrancyGuard, AccessControl {
    IVotes public immutable agntToken;
    AgentStaking public immutable stakingContract;

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        ProposalType proposalType;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        bytes executionData;
        address executionTarget;
    }

    enum ProposalType { FEE_CHANGE, TREASURY, FEATURE, SLASH, OTHER }
    enum VoteChoice { FOR, AGAINST, ABSTAIN }
    enum ProposalState { Pending, Active, Passed, Failed, Executed, Cancelled, Expired }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant PROPOSAL_THRESHOLD = 10000 * 10**18;
    uint256 public constant QUORUM_PERCENTAGE = 4; // 4% of total supply

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        ProposalType proposalType;
        uint256 snapshotBlock;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        address executionTarget;
        bytes executionData;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event VoteCast(uint256 indexed id, address indexed voter, VoteChoice choice, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);

    constructor(address _agntToken, address _stakingContract) {
        agntToken = IVotes(_agntToken);
        stakingContract = AgentStaking(_stakingContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function propose(
        string calldata title,
        string calldata description,
        ProposalType pType,
        address executionTarget,
        bytes calldata executionData
    ) external returns (uint256) {
        require(agntToken.getVotes(msg.sender) >= PROPOSAL_THRESHOLD, "AgentGovernance: below threshold");

        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.proposalType = pType;
        p.snapshotBlock = block.number;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + VOTING_PERIOD;
        p.executionTarget = executionTarget;
        p.executionData = executionData;

        emit ProposalCreated(proposalCount, msg.sender, title);
        return proposalCount;
    }

    function castVote(uint256 proposalId, VoteChoice choice) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "AgentGovernance: not active");
        require(!hasVoted[proposalId][msg.sender], "AgentGovernance: already voted");

        uint256 weight = agntToken.getPastVotes(msg.sender, p.snapshotBlock);
        require(weight > 0, "AgentGovernance: no weight");

        if (choice == VoteChoice.FOR) p.forVotes += weight;
        else if (choice == VoteChoice.AGAINST) p.againstVotes += weight;
        else p.abstainVotes += weight;

        hasVoted[proposalId][msg.sender] = true;
        emit VoteCast(proposalId, msg.sender, choice, weight);
    }

    function execute(uint256 proposalId) external payable nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == ProposalState.Passed, "AgentGovernance: not passed");
        require(block.timestamp >= p.endTime + EXECUTION_DELAY, "AgentGovernance: timelock active");
        
        p.executed = true;

        (bool success, ) = p.executionTarget.call{value: msg.value}(p.executionData);
        require(success, "AgentGovernance: execution failed");

        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(msg.sender == p.proposer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "AgentGovernance: unauthorized");
        require(!p.executed && !p.cancelled, "AgentGovernance: final state");
        
        p.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    function state(uint256 id) public view returns (ProposalState) {
        Proposal storage p = proposals[id];
        if (p.cancelled) return ProposalState.Cancelled;
        if (p.executed) return ProposalState.Executed;
        if (block.timestamp < p.startTime) return ProposalState.Pending;
        if (block.timestamp <= p.endTime) return ProposalState.Active;
        
        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        
        // Dynamic Quorum Check: Percentage of total supply at snapshot
        // We assume agntToken implements IERC20Votes (which has getPastTotalSupply)
        IERC20Votes token = IERC20Votes(address(agntToken));
        uint256 quorum = (token.getPastTotalSupply(p.snapshotBlock) * QUORUM_PERCENTAGE) / 100;
        
        if (totalVotes < quorum) return ProposalState.Failed;
        if (p.forVotes > p.againstVotes) return ProposalState.Passed;
        
        return ProposalState.Failed;
    }
}
