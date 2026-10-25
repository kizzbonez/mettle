// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Proxy} from "@openzeppelin/contracts/proxy/Proxy.sol";
import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

/// @notice The co-op's proxy: one address and one storage, with code that can be replaced.
/// @dev The first deployment of this pair broke at once. Fix both contracts as instructions.md
/// describes; keep every function, parameter, event and error.
contract DuesProxy is Proxy {
    /// @dev bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)
    bytes32 internal constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    /// @dev bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1)
    bytes32 internal constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    address public implementation;
    address public admin;

    event Upgraded(address indexed implementation);

    error NotAdmin(address caller);

    /// @notice Deploys the proxy and runs `initData` (the initializer) through it, in one step.
    constructor(address implementation_, bytes memory initData) {
        admin = msg.sender;
        implementation = implementation_;
        emit Upgraded(implementation_);
        Address.functionDelegateCall(implementation_, initData);
    }

    receive() external payable {
        _fallback();
    }

    /// @notice Points the proxy at new code. Only the admin may.
    function upgradeTo(address newImplementation) external {
        if (msg.sender != admin) revert NotAdmin(msg.sender);
        implementation = newImplementation;
        emit Upgraded(newImplementation);
    }

    function _implementation() internal view override returns (address) {
        return implementation;
    }
}

/// @notice Members' yearly dues, kept until the treasurer spends them on parts and tools.
/// @dev Runs behind DuesProxy: it is set up by `initialize`, never by a constructor.
contract DuesVault {
    address public treasurer;
    uint256 public total;
    mapping(address member => uint256) public paid;

    event DuesPaid(address indexed member, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error NotTreasurer(address caller);
    error PaymentFailed();

    /// @notice Sets the treasurer.
    function initialize(address treasurer_) external {
        treasurer = treasurer_;
    }

    function payDues() external payable {
        paid[msg.sender] += msg.value;
        total += msg.value;
        emit DuesPaid(msg.sender, msg.value);
    }

    /// @notice Pays `amount` wei of the dues to `to`. Only the treasurer may.
    function withdraw(address to, uint256 amount) external {
        if (msg.sender != treasurer) revert NotTreasurer(msg.sender);
        total -= amount;
        emit Withdrawn(to, amount);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
}
