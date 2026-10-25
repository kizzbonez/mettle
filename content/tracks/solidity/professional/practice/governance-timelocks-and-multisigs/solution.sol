// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {
    GovernorVotesQuorumFraction
} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/// @notice The residents' voting token. Voting power counts only after delegation, and time is
/// measured in seconds so that the council's durations can be written as `2 days`.
contract CivicToken is ERC20, ERC20Permit, ERC20Votes {
    constructor(address treasurer) ERC20("Civic", "CIVIC") ERC20Permit("Civic") {
        _mint(treasurer, 10_000e18);
    }

    /// @notice The token's clock: the block's timestamp, in seconds.
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /// @notice Tells the Governor (and off-chain tools) that the clock counts seconds.
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // The overrides below are required because two bases define the same function.

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}

/// @notice The parish council's governor: votes come from CIVIC, and every passed proposal runs
/// through the timelock, which owns the community fund.
contract CouncilGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(IVotes token, TimelockController timelock)
        Governor("CouncilGovernor")
        GovernorSettings(2 days, 5 days, 10e18) // voting delay, voting period, proposal threshold
        GovernorVotes(token)
        GovernorVotesQuorumFraction(10) // 10% of the supply at the snapshot
        GovernorTimelockControl(timelock)
    {}

    // The overrides below are required because two bases define the same function.

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}

/// @notice The community fund. Only the timelock pays grants and lifts a pause; the clerk, as
/// guardian, can only pause it.
contract CommunityFund {
    address public immutable timelock;
    address public immutable guardian;
    bool public paused;

    event Granted(address indexed to, uint256 amount);
    event PauseChanged(bool paused);

    error NotTimelock(address caller);
    error NotGuardian(address caller);
    error FundPaused();
    error GrantFailed();

    constructor(address timelock_, address guardian_) {
        timelock = timelock_;
        guardian = guardian_;
    }

    receive() external payable {}

    /// @notice Pays a grant that governance approved. Callable only by the timelock.
    function grant(address to, uint256 amount) external {
        if (msg.sender != timelock) revert NotTimelock(msg.sender);
        if (paused) revert FundPaused();
        emit Granted(to, amount);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert GrantFailed();
    }

    /// @notice Freezes grants at once. Callable only by the guardian.
    function pause() external {
        if (msg.sender != guardian) revert NotGuardian(msg.sender);
        paused = true;
        emit PauseChanged(true);
    }

    /// @notice Lifts the freeze. Only governance, through the timelock, may do this.
    function unpause() external {
        if (msg.sender != timelock) revert NotTimelock(msg.sender);
        paused = false;
        emit PauseChanged(false);
    }
}
