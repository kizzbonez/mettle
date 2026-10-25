// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Proxy} from "@openzeppelin/contracts/proxy/Proxy.sol";
import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

/// @notice The co-op's proxy: one address and one storage, with code that can be replaced.
/// @dev The proxy keeps its own state in the ERC-1967 slots, which no implementation's
/// variables can reach, so the vault's slot 0, 1, 2... are the vault's alone.
contract DuesProxy is Proxy {
    /// @dev bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)
    bytes32 internal constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    /// @dev bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1)
    bytes32 internal constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    event Upgraded(address indexed implementation);

    error NotAdmin(address caller);

    /// @notice Deploys the proxy and runs `initData` (the initializer) through it, in one step.
    constructor(address implementation_, bytes memory initData) {
        StorageSlot.getAddressSlot(ADMIN_SLOT).value = msg.sender;
        _upgradeTo(implementation_);
        Address.functionDelegateCall(implementation_, initData);
    }

    receive() external payable {
        _fallback();
    }

    function implementation() external view returns (address) {
        return _implementation();
    }

    function admin() external view returns (address) {
        return StorageSlot.getAddressSlot(ADMIN_SLOT).value;
    }

    /// @notice Points the proxy at new code. Only the admin may.
    function upgradeTo(address newImplementation) external {
        if (msg.sender != StorageSlot.getAddressSlot(ADMIN_SLOT).value) revert NotAdmin(msg.sender);
        _upgradeTo(newImplementation);
    }

    function _upgradeTo(address newImplementation) private {
        StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value = newImplementation;
        emit Upgraded(newImplementation);
    }

    function _implementation() internal view override returns (address) {
        return StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value;
    }
}

/// @notice Members' yearly dues, kept until the treasurer spends them on parts and tools.
/// @dev Runs behind DuesProxy: it is set up by `initialize`, once, never by a constructor.
contract DuesVault is Initializable {
    address public treasurer;
    uint256 public total;
    mapping(address member => uint256) public paid;

    event DuesPaid(address indexed member, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error NotTreasurer(address caller);
    error PaymentFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // the implementation itself can never be initialized
    }

    /// @notice Sets the treasurer. Runs once, through the proxy.
    function initialize(address treasurer_) external initializer {
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
