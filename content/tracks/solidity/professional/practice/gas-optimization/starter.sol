// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Season passes for a botanic garden. This version works, but it wastes gas:
/// make it cheaper without changing what any function does (see the instructions).
contract GardenPasses {
    struct Pass {
        address holder;
        uint256 validFrom;
        uint256 visitsLeft;
        bool active;
    }

    address public warden;
    uint256 public passCount;
    uint256 public totalVisits;
    mapping(uint256 => Pass) private passes;
    mapping(uint256 => bool) private seedsClaimed;

    error NotWarden(address caller);
    error NotHolder(uint256 id, address caller);
    error PassNotActive(uint256 id);
    error TooEarly(uint256 id, uint256 validFrom);
    error NoVisitsLeft(uint256 id);
    error SeedsAlreadyClaimed(uint256 id);

    event PassIssued(uint256 indexed id, address indexed holder, uint48 validFrom, uint16 visits);
    event Visited(uint256 indexed id, uint256 visitsLeft);
    event PassCancelled(uint256 indexed id);

    constructor() {
        warden = msg.sender;
    }

    /// @notice Issues a pass with `visits` visits, usable from the time `validFrom`. Warden only.
    function issue(address holder, uint48 validFrom, uint16 visits) external returns (uint256 id) {
        if (msg.sender != warden) revert NotWarden(msg.sender);
        passCount = passCount + 1;
        id = passCount;
        passes[id].holder = holder;
        passes[id].validFrom = validFrom;
        passes[id].visitsLeft = visits;
        passes[id].active = true;
        emit PassIssued(id, holder, validFrom, visits);
    }

    /// @notice The holder of pass `id` uses one visit.
    function checkIn(uint256 id) external {
        if (passes[id].holder != msg.sender) revert NotHolder(id, msg.sender);
        if (!passes[id].active) revert PassNotActive(id);
        if (block.timestamp < passes[id].validFrom) revert TooEarly(id, passes[id].validFrom);
        if (passes[id].visitsLeft == 0) revert NoVisitsLeft(id);
        passes[id].visitsLeft = passes[id].visitsLeft - 1;
        totalVisits = totalVisits + 1;
        emit Visited(id, passes[id].visitsLeft);
    }

    /// @notice The warden checks in a whole school group at once: one visit from each pass.
    function checkInGroup(uint256[] memory ids) external {
        if (msg.sender != warden) revert NotWarden(msg.sender);
        for (uint256 i = 0; i < ids.length; i++) {
            if (!passes[ids[i]].active) revert PassNotActive(ids[i]);
            if (block.timestamp < passes[ids[i]].validFrom) revert TooEarly(ids[i], passes[ids[i]].validFrom);
            if (passes[ids[i]].visitsLeft == 0) revert NoVisitsLeft(ids[i]);
            passes[ids[i]].visitsLeft = passes[ids[i]].visitsLeft - 1;
            totalVisits = totalVisits + 1;
            emit Visited(ids[i], passes[ids[i]].visitsLeft);
        }
    }

    /// @notice The holder of pass `id` collects the free packet of seeds that comes with it.
    function claimSeeds(uint256 id) external {
        if (passes[id].holder != msg.sender) revert NotHolder(id, msg.sender);
        if (seedsClaimed[id]) revert SeedsAlreadyClaimed(id);
        seedsClaimed[id] = true;
    }

    /// @notice Cancels pass `id`. Warden only.
    function cancel(uint256 id) external {
        if (msg.sender != warden) revert NotWarden(msg.sender);
        if (!passes[id].active) revert PassNotActive(id);
        passes[id].active = false;
        emit PassCancelled(id);
    }

    function passOf(uint256 id)
        external
        view
        returns (address holder, uint48 validFrom, uint16 visitsLeft, bool active)
    {
        Pass memory p = passes[id];
        return (p.holder, uint48(p.validFrom), uint16(p.visitsLeft), p.active);
    }

    function hasClaimedSeeds(uint256 id) external view returns (bool) {
        return seedsClaimed[id];
    }
}
