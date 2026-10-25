// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @notice Pays orchard pickers for their crates, on vouchers the coordinator signs off chain.
/// @dev A voucher is EIP-712 typed data, so it is only valid on this contract, on this chain,
/// before its deadline, and once: each picker's vouchers carry consecutive nonces.
contract HarvestPay is EIP712, Nonces {
    bytes32 public constant VOUCHER_TYPEHASH =
        keccak256("Voucher(address picker,uint256 amount,uint256 nonce,uint256 deadline)");

    /// @notice The key that signs vouchers; zero once the season is over.
    address public coordinator;

    event Paid(address indexed picker, uint256 amount, uint256 nonce);

    error Expired(uint256 deadline);
    error WrongSigner(address recovered);
    error NotCoordinator(address caller);
    error PaymentFailed();

    constructor(address coordinator_) payable EIP712("HarvestPay", "1") {
        coordinator = coordinator_;
    }

    receive() external payable {}

    /// @notice The EIP-712 digest the coordinator signs for a voucher.
    function voucherDigest(address picker, uint256 amount, uint256 nonce, uint256 deadline)
        public
        view
        returns (bytes32)
    {
        return _hashTypedDataV4(keccak256(abi.encode(VOUCHER_TYPEHASH, picker, amount, nonce, deadline)));
    }

    /// @notice Pays `amount` wei to `picker` for a voucher signed by the coordinator.
    /// @dev Anyone may submit a voucher; the money always goes to the picker it names.
    function redeem(address picker, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata signature)
        external
    {
        if (block.timestamp > deadline) revert Expired(deadline);
        // ECDSA.recover reverts on an invalid or malleable signature instead of returning zero.
        address signer = ECDSA.recover(voucherDigest(picker, amount, nonce, deadline), signature);
        if (signer != coordinator) revert WrongSigner(signer);
        _useCheckedNonce(picker, nonce); // before the payment: a voucher works once
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
