// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Season passes for a botanic garden, written to spend little gas: one storage
/// slot per pass, an immutable warden, each slot read once, and a bitmap for the seed claims.
contract GardenPasses {
    /// @dev 20 + 6 + 2 + 1 = 29 bytes, so a whole pass lives in one storage slot.
    struct Pass {
        address holder;
        uint48 validFrom;
        uint16 visitsLeft;
        bool active;
    }

    /// @notice Set once at deployment, so it is kept in the bytecode instead of in storage.
    address public immutable warden;
    uint256 public passCount;
    uint256 public totalVisits;
    mapping(uint256 => Pass) private passes;
    /// @dev Bit `id % 256` of word `id / 256` is set once pass `id` has claimed its seeds.
    mapping(uint256 => uint256) private seedsClaimedWords;

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

    modifier onlyWarden() {
        if (msg.sender != warden) revert NotWarden(msg.sender);
        _;
    }

    /// @notice Issues a pass with `visits` visits, usable from the time `validFrom`. Warden only.
    function issue(address holder, uint48 validFrom, uint16 visits) external onlyWarden returns (uint256 id) {
        id = passCount + 1; // one read of passCount
        passCount = id;
        // A whole struct in one assignment: one SSTORE for the slot.
        passes[id] = Pass({holder: holder, validFrom: validFrom, visitsLeft: visits, active: true});
        emit PassIssued(id, holder, validFrom, visits);
    }

    /// @notice The holder of pass `id` uses one visit.
    function checkIn(uint256 id) external {
        Pass storage slot = passes[id];
        Pass memory p = slot; // one SLOAD brings every field
        if (p.holder != msg.sender) revert NotHolder(id, msg.sender);
        _useVisit(slot, p, id);
        totalVisits += 1;
    }

    /// @notice The warden checks in a whole school group at once: one visit from each pass.
    function checkInGroup(uint256[] calldata ids) external onlyWarden {
        uint256 n = ids.length;
        for (uint256 i = 0; i < n; ++i) {
            uint256 id = ids[i];
            Pass storage slot = passes[id];
            _useVisit(slot, slot, id);
        }
        totalVisits += n; // one write for the whole group instead of one per pass
    }

    /// @notice The holder of pass `id` collects the free packet of seeds that comes with it.
    function claimSeeds(uint256 id) external {
        if (passes[id].holder != msg.sender) revert NotHolder(id, msg.sender);
        uint256 word = id >> 8;
        uint256 bit = 1 << (id & 0xff);
        uint256 bits = seedsClaimedWords[word];
        if (bits & bit != 0) revert SeedsAlreadyClaimed(id);
        seedsClaimedWords[word] = bits | bit;
    }

    /// @notice Cancels pass `id`. Warden only.
    function cancel(uint256 id) external onlyWarden {
        Pass storage slot = passes[id];
        if (!slot.active) revert PassNotActive(id);
        slot.active = false;
        emit PassCancelled(id);
    }

    function passOf(uint256 id)
        external
        view
        returns (address holder, uint48 validFrom, uint16 visitsLeft, bool active)
    {
        Pass memory p = passes[id];
        return (p.holder, p.validFrom, p.visitsLeft, p.active);
    }

    function hasClaimedSeeds(uint256 id) external view returns (bool) {
        return seedsClaimedWords[id >> 8] & (1 << (id & 0xff)) != 0;
    }

    /// @dev Checks a pass that was read once and writes back the one field that changes.
    function _useVisit(Pass storage slot, Pass memory p, uint256 id) private {
        if (!p.active) revert PassNotActive(id);
        if (block.timestamp < p.validFrom) revert TooEarly(id, p.validFrom);
        if (p.visitsLeft == 0) revert NoVisitsLeft(id);
        uint16 left = p.visitsLeft - 1;
        slot.visitsLeft = left;
        emit Visited(id, left);
    }
}
