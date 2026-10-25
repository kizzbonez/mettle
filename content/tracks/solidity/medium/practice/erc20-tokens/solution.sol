// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

/// @notice Shares in the kelp co-op's harvest: a hand-written ERC-20 with OpenZeppelin's errors.
contract KelpShare is IERC20, IERC20Errors {
    error NotSecretary(address caller);

    string public constant name = "Kelp Co-op Share";
    string public constant symbol = "KELP";
    /// @notice Shares are counted in hundredths: 100 units display as 1.00 share.
    uint8 public constant decimals = 2;

    address public immutable secretary;
    uint256 public totalSupply;
    mapping(address account => uint256) public balanceOf;
    mapping(address owner => mapping(address spender => uint256)) public allowance;

    constructor() {
        secretary = msg.sender;
    }

    /// @notice Issues `value` new units to `to`. Only the co-op's secretary may do this.
    function mint(address to, uint256 value) external {
        if (msg.sender != secretary) revert NotSecretary(msg.sender);
        if (to == address(0)) revert ERC20InvalidReceiver(address(0));
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    /// @notice Moves `value` units from the caller to `to`.
    function transfer(address to, uint256 value) external returns (bool) {
        _move(msg.sender, to, value);
        return true;
    }

    /// @notice Lets `spender` move up to `value` of the caller's units. Replaces any earlier allowance.
    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert ERC20InvalidSpender(address(0));
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    /// @notice Moves `value` units from `from` to `to`, spending the caller's allowance.
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        // An unlimited allowance stays unlimited; any other is spent.
        if (allowed != type(uint256).max) {
            if (allowed < value) revert ERC20InsufficientAllowance(msg.sender, allowed, value);
            allowance[from][msg.sender] = allowed - value;
        }
        _move(from, to, value);
        return true;
    }

    /// @dev The one place balances change hands. Reading and writing the sender's balance before
    /// touching the receiver's keeps a transfer to yourself from creating units.
    function _move(address from, address to, uint256 value) private {
        if (to == address(0)) revert ERC20InvalidReceiver(address(0));
        uint256 fromBalance = balanceOf[from];
        if (fromBalance < value) revert ERC20InsufficientBalance(from, fromBalance, value);
        balanceOf[from] = fromBalance - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
