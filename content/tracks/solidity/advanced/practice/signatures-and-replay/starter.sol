// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @notice Pays orchard pickers for their crates, on vouchers the coordinator signs off chain.
/// @dev This is the version that was drained: one voucher was redeemed eleven times. Fix it as
/// instructions.md describes; keep every name, parameter and error.
contract HarvestPay {
    bytes32 public constant VOUCHER_TYPEHASH =
        keccak256("Voucher(address picker,uint256 amount,uint256 nonce,uint256 deadline)");

    /// @notice The key that signs vouchers; zero once the season is over.
    address public coordinator;

    event Paid(address indexed picker, uint256 amount, uint256 nonce);

    error Expired(uint256 deadline);
    error WrongSigner(address recovered);
    error NotCoordinator(address caller);
    error PaymentFailed();

    constructor(address coordinator_) payable {
        coordinator = coordinator_;
    }

    receive() external payable {}

    /// @notice The digest the coordinator signs for a voucher.
    function voucherDigest(address picker, uint256 amount, uint256 nonce, uint256 deadline)
        public
        pure
        returns (bytes32)
    {
        return MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encode(picker, amount, nonce, deadline)));
    }

    /// @notice Pays `amount` wei to `picker` for a voucher signed by the coordinator.
    function redeem(address picker, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata signature)
        external
    {
        (uint8 v, bytes32 r, bytes32 s) = ECDSA.parse(signature);
        address signer = ecrecover(voucherDigest(picker, amount, nonce, deadline), v, r, s);
        if (signer != coordinator) revert WrongSigner(signer);
        emit Paid(picker, amount, nonce);
        (bool ok,) = picker.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }

    /// @notice Ends the season: no voucher can be redeemed after this.
    function retire() external {
        if (msg.sender != coordinator) revert NotCoordinator(msg.sender);
        coordinator = address(0);
    }
}
