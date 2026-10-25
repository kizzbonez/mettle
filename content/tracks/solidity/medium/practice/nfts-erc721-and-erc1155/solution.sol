// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Orchard tree adoption certificates
/// @notice Each neighbour may adopt one of the orchard's trees for free. The certificate is an
///         ERC-721 token that can be given away, but nobody may hold more than two.
contract OrchardTrees is ERC721 {
    /// @notice How many trees the orchard has; their ids are 1 to TREES.
    uint256 public constant TREES = 5;
    /// @notice The most certificates one address may hold.
    uint256 public constant MAX_PER_HOLDER = 2;

    /// @notice How many trees have been adopted so far (the last id handed out).
    uint256 public adopted;
    /// @notice Whether an address has ever adopted a tree, even if it gave the certificate away.
    mapping(address => bool) public hasAdopted;

    error AlreadyAdopted(address who);
    error AllAdopted();
    error TooManyTrees(address holder);

    constructor() ERC721("Orchard Trees", "TREE") {}

    /// @notice Adopts the next tree and mints its certificate to the caller.
    /// @return id The id of the adopted tree.
    function adopt() external returns (uint256 id) {
        // Checks.
        if (hasAdopted[msg.sender]) revert AlreadyAdopted(msg.sender);
        if (adopted == TREES) revert AllAdopted();

        // Effects: all bookkeeping is done before the receiver hook can run.
        hasAdopted[msg.sender] = true;
        id = ++adopted;

        // Interaction: _safeMint calls onERC721Received if the caller is a contract.
        _safeMint(msg.sender, id);
    }

    /// @dev tokenURI(id) is this base followed by the id.
    function _baseURI() internal pure override returns (string memory) {
        return "https://orchard.example/trees/";
    }

    /// @dev Every mint and transfer passes through here, so the holder limit covers both.
    function _update(address to, uint256 id, address auth) internal override returns (address) {
        if (to != address(0) && balanceOf(to) >= MAX_PER_HOLDER) revert TooManyTrees(to);
        return super._update(to, id, auth);
    }
}
