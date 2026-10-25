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
        _disableInitializers(); // the implementation itself can never be initialized
    }

    /// @notice Sets the owner. Runs once, through the proxy's constructor.
    function initialize(address owner_) external initializer {
        if (owner_ == address(0)) revert ZeroOwner();
        _stampCard().owner = owner_;
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

    /// @dev Only the owner may move the proxy to a new implementation.
    function _authorizeUpgrade(address) internal view override {
        if (msg.sender != _stampCard().owner) revert NotOwner(msg.sender);
    }

    /// @dev The namespace's base slot, computed by the compiler with the ERC-7201 formula.
    function _stampCard() private pure returns (StampCardStorage storage $) {
        bytes32 slot = bytes32(erc7201("bakery.storage.StampCard"));
        assembly {
            $.slot := slot
        }
    }
}

/// @notice Version 2: the same namespace with one field appended, and loaves for stamps.
contract StampCardV2 is Initializable, UUPSUpgradeable {
    /// @custom:storage-location erc7201:bakery.storage.StampCard
    struct StampCardStorage {
        address owner;
        mapping(address => uint256) stamps;
        uint256 totalStamps;
        uint256 threshold; // new in V2: appended after every V1 field
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

    /// @notice Sets the number of stamps a loaf costs. Runs once, in the upgrade call, by the owner.
    function initializeV2(uint256 threshold_) external reinitializer(2) {
        StampCardStorage storage $ = _stampCard();
        if (msg.sender != $.owner) revert NotOwner(msg.sender);
        if (threshold_ == 0) revert ZeroThreshold();
        $.threshold = threshold_;
    }

    function stamp(address customer) external {
        StampCardStorage storage $ = _stampCard();
        if (msg.sender != $.owner) revert NotOwner(msg.sender);
        uint256 count = $.stamps[customer] + 1;
        $.stamps[customer] = count;
        $.totalStamps += 1;
        emit Stamped(customer, count);
    }

    /// @notice The caller trades `threshold` stamps for a loaf.
    function redeem() external {
        StampCardStorage storage $ = _stampCard();
        uint256 have = $.stamps[msg.sender];
        uint256 need = $.threshold;
        if (have < need) revert NotEnoughStamps(have, need);
        $.stamps[msg.sender] = have - need;
        emit Redeemed(msg.sender, have - need);
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

    function threshold() external view returns (uint256) {
        return _stampCard().threshold;
    }

    function version() external pure returns (uint256) {
        return 2;
    }

    function _authorizeUpgrade(address) internal view override {
        if (msg.sender != _stampCard().owner) revert NotOwner(msg.sender);
    }

    function _stampCard() private pure returns (StampCardStorage storage $) {
        bytes32 slot = bytes32(erc7201("bakery.storage.StampCard"));
        assembly {
            $.slot := slot
        }
    }
}
