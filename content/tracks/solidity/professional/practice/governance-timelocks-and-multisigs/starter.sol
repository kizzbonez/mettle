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

/// @notice The residents' voting token.
contract CivicToken is ERC20, ERC20Permit, ERC20Votes {
    constructor(address treasurer) ERC20("Civic", "CIVIC") ERC20Permit("Civic") {
        _mint(treasurer, 10_000e18);
    }

    // Task 1: make the token count time in seconds by overriding clock() and CLOCK_MODE().

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}

/// @notice Task 2: the parish council's governor.
contract CouncilGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes {
    constructor(IVotes token, TimelockController timelock)
        Governor("CouncilGovernor")
        GovernorSettings(1, 1, 0) // voting delay, voting period, proposal threshold: set the real values
        GovernorVotes(token)
    {}

    // Replace this with GovernorVotesQuorumFraction.
    function quorum(uint256) public pure override returns (uint256) {
        revert("not implemented: quorum");
    }

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}

/// @notice Task 3: the community fund.
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

    function grant(address to, uint256 amount) external {
        revert("not implemented: grant");
    }

    function pause() external {
        revert("not implemented: pause");
    }

    function unpause() external {
        revert("not implemented: unpause");
    }
}
