// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The drama society's costume wardrobe: the keeper lists costumes, members hire them,
/// and a member may let a friend collect costumes for them.
contract CostumeWardrobe {
    enum Status {
        Unknown, // the zero value: every id that was never added
        Available,
        OnHire
    }

    struct Costume {
        string name;
        Status status;
        address hirer;
        uint256 timesHired;
    }

    uint256 public constant MAX_COSTUMES = 100;
    uint256 public constant MAX_ON_HIRE = 2;

    address public immutable keeper;
    mapping(uint256 => Costume) public costumes;
    uint256[] public costumeIds; // the keys of `costumes`, so they can be listed
    mapping(address => uint256) public onHireBy;
    /// @notice mayCollectFor[member][collector]: may `collector` hire costumes for `member`?
    mapping(address => mapping(address => bool)) public mayCollectFor;

    error NotKeeper(address caller);
    error CostumeExists(uint256 id);
    error WardrobeFull(uint256 max);
    error NoSuchCostume(uint256 id);
    error NotAllowed(address member, address collector);
    error NotAvailable(uint256 id, Status status);
    error TooManyOnHire(address member, uint256 max);
    error NotOnHire(uint256 id);
    error NotHirer(uint256 id, address caller);

    constructor() {
        keeper = msg.sender;
    }

    function costumeCount() external view returns (uint256) {
        return costumeIds.length;
    }

    /// @notice Lets `collector` hire costumes for the caller, or stops it.
    function allowCollector(address collector, bool allowed) external {
        mayCollectFor[msg.sender][collector] = allowed;
    }

    /// @notice The ids of the costumes that can be hired now, in the order of `costumeIds`.
    function availableIds() external view returns (uint256[] memory ids) {
        uint256 count = 0;
        for (uint256 i = 0; i < costumeIds.length; i++) {
            if (costumes[costumeIds[i]].status == Status.Available) count++;
        }
        ids = new uint256[](count);
        uint256 next = 0;
        for (uint256 i = 0; i < costumeIds.length; i++) {
            if (costumes[costumeIds[i]].status == Status.Available) ids[next++] = costumeIds[i];
        }
    }

    /// @notice Adds a costume under a new id. Only the keeper.
    function addCostume(uint256 id, string memory name) external {
        // Task 1
        revert("not implemented: addCostume");
    }

    /// @notice Hires costume `id` for `member`: the caller is the member or a collector they allowed.
    function hire(uint256 id, address member) external {
        // Task 2
        revert("not implemented: hire");
    }

    /// @notice Gives costume `id` back. Only its hirer or the keeper.
    function giveBack(uint256 id) external {
        // Task 3
        revert("not implemented: giveBack");
    }

    /// @notice Removes costume `id` for good. Only the keeper, and not while it is on hire.
    function retire(uint256 id) external {
        // Task 4
        revert("not implemented: retire");
    }
}
