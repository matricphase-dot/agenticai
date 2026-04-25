// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Treasury
 * @dev Protocol treasury managed by the AgentGovernance contract.
 */
contract Treasury is ReentrancyGuard, AccessControl {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    IERC20 public immutable agntToken;

    event FundsAllocated(address indexed recipient, uint256 amount, string reason);
    event EthAllocated(address payable indexed recipient, uint256 amount, string reason);
    event BatchFundsAllocated(address[] recipients, uint256[] amounts);

    constructor(address _agntToken) {
        agntToken = IERC20(_agntToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function allocate(address recipient, uint256 amount, string calldata reason) external onlyRole(GOVERNANCE_ROLE) nonReentrant {
        require(agntToken.balanceOf(address(this)) >= amount, "Treasury: insufficient AGNT balance");
        agntToken.transfer(recipient, amount);
        emit FundsAllocated(recipient, amount, reason);
    }

    function allocateBatch(address[] calldata recipients, uint256[] calldata amounts) external onlyRole(GOVERNANCE_ROLE) nonReentrant {
        require(recipients.length == amounts.length, "Treasury: length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(agntToken.balanceOf(address(this)) >= amounts[i], "Treasury: insufficient AGNT balance");
            agntToken.transfer(recipients[i], amounts[i]);
        }
        emit BatchFundsAllocated(recipients, amounts);
    }

    function allocateEth(address payable recipient, uint256 amount, string calldata reason) external onlyRole(GOVERNANCE_ROLE) nonReentrant {
        require(address(this).balance >= amount, "Treasury: insufficient ETH balance");
        recipient.transfer(amount);
        emit EthAllocated(recipient, amount, reason);
    }

    function getBalance() public view returns (uint256) {
        return agntToken.balanceOf(address(this));
    }

    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
