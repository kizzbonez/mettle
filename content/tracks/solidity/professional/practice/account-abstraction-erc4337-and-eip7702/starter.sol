// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PackedUserOperation} from "@openzeppelin/contracts/interfaces/IERC4337.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice EOAs delegate to this contract with EIP-7702. Its code then runs as the EOA:
/// `address(this)` is the EOA, and the balance and storage are the EOA's.
contract StudioDelegate {
    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    /// @notice The ERC-4337 EntryPoint this account trusts. It is immutable, so it is part of the
    /// code that every delegated EOA runs.
    address public immutable entryPoint;

    error Unauthorized(address caller);
    error CallFailed(uint256 index);
    error PrefundFailed();

    constructor(address entryPoint_) {
        entryPoint = entryPoint_;
    }

    // Task 1: accept plain ether payments here.

    // Task 2
    function execute(Call[] calldata calls) external payable {
        revert("not implemented: execute");
    }

    // Task 3
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        returns (uint256 validationData)
    {
        revert("not implemented: validateUserOp");
    }
}
