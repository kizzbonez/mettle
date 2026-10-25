// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Orchard tree adoption certificates
contract OrchardTrees is ERC721 {
    uint256 public constant TREES = 5;
    uint256 public constant MAX_PER_HOLDER = 2;

    uint256 public adopted;
    mapping(address => bool) public hasAdopted;

    error AlreadyAdopted(address who);
    error AllAdopted();
    error TooManyTrees(address holder);

    constructor() ERC721("Orchard Trees", "TREE") {}

    // Task 1: adopt the next tree. Mind the order: the receiver hook runs inside _safeMint.
    function adopt() external returns (uint256 id) {
        revert("not implemented: adopt");
    }

    // Task 2: return the base of every tokenURI.
    function _baseURI() internal pure override returns (string memory) {
        revert("not implemented: _baseURI");
    }

    // Task 3: enforce MAX_PER_HOLDER before handing over to OpenZeppelin's _update.
    function _update(address to, uint256 id, address auth) internal override returns (address) {
        return super._update(to, id, auth);
    }
}
