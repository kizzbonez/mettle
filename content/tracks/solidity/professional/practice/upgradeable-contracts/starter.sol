// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/// @notice Version 1 of the bakery's loyalty stamp card, deployed behind an ERC1967Proxy.
contract StampCardV1 is Initializable, UUPSUpgradeable {
    /// @custom:storage-location erc7201:bakery.storage.StampCard
    struct StampCardStorage {
        address owner;
        mapping(address => uint256) stamps;
        uint256 totalStamps;
    }

    error NotOwner(address caller);
    error ZeroOwner();

    event Stamped(address indexed customer, uint256 stamps);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Task 2: lock the implementation.
    }

    /// @notice Task 2: sets the owner. Runs once, through the proxy's constructor.
    function initialize(address owner_) external {
        revert("not implemented: initialize");
    }

    /// @notice Gives `customer` one stamp. Owner only.
    function stamp(address customer) external {
        StampCardStorage storage $ = _stampCard();
        if (msg.sender != $.owner) revert NotOwner(msg.sender);
        uint256 count = $.stamps[customer] + 1;
        $.stamps[customer] = count;
        $.totalStamps += 1;
        emit Stamped(customer, count);
    }

    function owner() external view returns (address) {
        return _stampCard().owner;
    }

    function stampsOf(address customer) external view returns (uint256) {
        return _stampCard().stamps[customer];
    }

    function totalStamps() external view returns (uint256) {
        return _stampCard().totalStamps;
    }

    function version() external pure virtual returns (uint256) {
        return 1;
    }

    /// @dev Task 3: only the owner may move the proxy to a new implementation.
    function _authorizeUpgrade(address) internal view override {
        revert("not implemented: _authorizeUpgrade");
    }

    /// @dev Task 1: point $ at the ERC-7201 base slot of "bakery.storage.StampCard".
    function _stampCard() private pure returns (StampCardStorage storage $) {
        bytes32 slot = 0; // replace with the namespace's base slot
        assembly {
            $.slot := slot
        }
    }
}

/// @notice Task 4: version 2, with the same namespace and loaves for stamps.
contract StampCardV2 is Initializable, UUPSUpgradeable {
    /// @custom:storage-location erc7201:bakery.storage.StampCard
    struct StampCardStorage {
        address owner;
        mapping(address => uint256) stamps;
        uint256 totalStamps;
        // Task 4: add `uint256 threshold` where an upgrade allows it.
    }

    error NotOwner(address caller);
    error ZeroOwner();
    error NotEnoughStamps(uint256 have, uint256 need);
    error ZeroThreshold();

    event Stamped(address indexed customer, uint256 stamps);
    event Redeemed(address indexed customer, uint256 stampsLeft);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Task 4: sets the number of stamps a loaf costs. Runs once, in the upgrade call.
    function initializeV2(uint256 threshold_) external {
        revert("not implemented: initializeV2");
    }

    function stamp(address customer) external {
        StampCardStorage storage $ = _stampCard();
        if (msg.sender != $.owner) revert NotOwner(msg.sender);
        uint256 count = $.stamps[customer] + 1;
        $.stamps[customer] = count;
        $.totalStamps += 1;
        emit Stamped(customer, count);
    }

    /// @notice Task 5: the caller trades `threshold` stamps for a loaf.
    function redeem() external {
        revert("not implemented: redeem");
    }

    function owner() external view returns (address) {
        return _stampCard().owner;
    }

    function stampsOf(address customer) external view returns (uint256) {
        return _stampCard().stamps[customer];
    }

    function totalStamps() external view returns (uint256) {
        return _stampCard().totalStamps;
    }

    /// @notice Task 4: the number of stamps a loaf costs.
    function threshold() external view returns (uint256) {
        revert("not implemented: threshold");
    }

    function version() external pure returns (uint256) {
        return 2;
    }

    function _authorizeUpgrade(address) internal view override {
        if (msg.sender != _stampCard().owner) revert NotOwner(msg.sender);
    }

    function _stampCard() private pure returns (StampCardStorage storage $) {
        bytes32 slot = 0; // Task 4: the same base slot as version 1
        assembly {
            $.slot := slot
        }
    }
}
