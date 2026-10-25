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
        if (msg.sender != keeper) revert NotKeeper(msg.sender);
        if (costumes[id].status != Status.Unknown) revert CostumeExists(id);
        if (costumeIds.length == MAX_COSTUMES) revert WardrobeFull(MAX_COSTUMES);

        costumes[id] = Costume({name: name, status: Status.Available, hirer: address(0), timesHired: 0});
        costumeIds.push(id);
    }

    /// @notice Hires costume `id` for `member`: the caller is the member or a collector they allowed.
    function hire(uint256 id, address member) external {
        Costume storage costume = costumes[id]; // a storage reference: the changes below are saved
        if (costume.status == Status.Unknown) revert NoSuchCostume(id);
        if (msg.sender != member && !mayCollectFor[member][msg.sender]) {
            revert NotAllowed(member, msg.sender);
        }
        if (costume.status != Status.Available) revert NotAvailable(id, costume.status);
        if (onHireBy[member] == MAX_ON_HIRE) revert TooManyOnHire(member, MAX_ON_HIRE);

        costume.status = Status.OnHire;
        costume.hirer = member;
        costume.timesHired += 1;
        onHireBy[member] += 1;
    }

    /// @notice Gives costume `id` back. Only its hirer or the keeper.
    function giveBack(uint256 id) external {
        Costume storage costume = costumes[id];
        if (costume.status == Status.Unknown) revert NoSuchCostume(id);
        if (costume.status != Status.OnHire) revert NotOnHire(id);
        if (msg.sender != costume.hirer && msg.sender != keeper) revert NotHirer(id, msg.sender);

        onHireBy[costume.hirer] -= 1;
        costume.status = Status.Available;
        delete costume.hirer;
    }

    /// @notice Removes costume `id` for good. Only the keeper, and not while it is on hire.
    function retire(uint256 id) external {
        if (msg.sender != keeper) revert NotKeeper(msg.sender);
        Status status = costumes[id].status;
        if (status == Status.Unknown) revert NoSuchCostume(id);
        if (status != Status.Available) revert NotAvailable(id, status);

        delete costumes[id]; // every field back to zero: the id is Unknown again
        // Remove the key too, with swap-and-pop. The loop is bounded by MAX_COSTUMES.
        for (uint256 i = 0; i < costumeIds.length; i++) {
            if (costumeIds[i] == id) {
                costumeIds[i] = costumeIds[costumeIds.length - 1];
                costumeIds.pop();
                break;
            }
        }
    }
}
