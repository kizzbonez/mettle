// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PackedUserOperation} from "@openzeppelin/contracts/interfaces/IERC4337.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice EOAs delegate to this contract with EIP-7702. Its code then runs as the EOA:
/// `address(this)` is the EOA, and the balance and storage are the EOA's.
/// @dev Stateless on purpose: it keeps no storage, so nothing needs initialising per EOA and
/// nothing is left behind if the EOA delegates elsewhere later.
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

    /// @notice A delegated EOA runs this code for every call, plain payments included.
    receive() external payable {}

    /// @notice Runs `calls` in order. Only the EOA itself, or the EntryPoint after validating a
    /// user operation, may ask; one failing call reverts the whole batch.
    function execute(Call[] calldata calls) external payable {
        if (msg.sender != address(this) && msg.sender != entryPoint) revert Unauthorized(msg.sender);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool ok,) = calls[i].to.call{value: calls[i].value}(calls[i].data);
            if (!ok) revert CallFailed(i);
        }
    }

    /// @notice ERC-4337 validation: the EOA's own key must have signed `userOpHash`.
    /// @return validationData 0 for a valid signature, 1 (SIG_VALIDATION_FAILED) otherwise.
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        returns (uint256 validationData)
    {
        if (msg.sender != entryPoint) revert Unauthorized(msg.sender);
        // tryRecover never reverts, so a malformed signature is just "not valid".
        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(userOpHash, userOp.signature);
        validationData = (err == ECDSA.RecoverError.NoError && signer == address(this)) ? 0 : 1;
        if (missingAccountFunds > 0) {
            (bool ok,) = payable(msg.sender).call{value: missingAccountFunds}("");
            if (!ok) revert PrefundFailed();
        }
    }
}
