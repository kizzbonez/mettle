// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

/// @notice Shares in the kelp co-op's harvest: a hand-written ERC-20 with OpenZeppelin's errors.
/// The events Transfer and Approval come from IERC20, the ERC20... errors from IERC20Errors.
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

    // Task 1: issue new units (secretary only).
    function mint(address to, uint256 value) external {
        revert("not implemented: mint");
    }

    // Task 2: the one place balances change hands; transfer and transferFrom both use it.
    function _move(address from, address to, uint256 value) private {
        revert("not implemented: _move");
    }

    // Task 3
    function transfer(address to, uint256 value) external returns (bool) {
        revert("not implemented: transfer");
    }

    // Task 4
    function approve(address spender, uint256 value) external returns (bool) {
        revert("not implemented: approve");
    }

    // Task 5
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        revert("not implemented: transferFrom");
    }
}
