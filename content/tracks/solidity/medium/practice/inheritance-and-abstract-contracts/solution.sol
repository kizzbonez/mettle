// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice A single owner, set at deployment.
contract Owned {
    error NotOwner(address caller);

    address public owner;

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }
}

/// @notice The booking procedure shared by every desk. Each desk sets its fee and may add rules.
abstract contract BookingDesk is Owned {
    event Booked(address indexed booker, uint256 indexed slot);

    error SlotTaken(uint256 slot);
    error WrongFee(uint256 sent, uint256 fee);
    error PayoutFailed();

    mapping(uint256 slot => address) public bookedBy;

    constructor() Owned(msg.sender) {}

    /// @notice Books `slot` for the caller, who pays exactly `fee()`.
    function book(uint256 slot) external payable {
        if (bookedBy[slot] != address(0)) revert SlotTaken(slot);
        uint256 due = fee();
        if (msg.value != due) revert WrongFee(msg.value, due);
        _checkBooking(msg.sender, slot);
        bookedBy[slot] = msg.sender;
        emit Booked(msg.sender, slot);
    }

    /// @notice Sends the collected fees to the owner.
    function withdraw() external onlyOwner {
        (bool ok,) = owner.call{value: address(this).balance}("");
        if (!ok) revert PayoutFailed();
    }

    /// @notice The fee for one slot, in wei.
    function fee() public view virtual returns (uint256);

    /// @dev Extra rules for a booking. Each override checks its own rule, then calls super.
    function _checkBooking(address booker, uint256 slot) internal virtual {}
}

/// @notice Only members chosen by the owner may book.
abstract contract MembersOnly is BookingDesk {
    error NotMember(address booker);

    mapping(address => bool) public isMember;

    function setMember(address who, bool member) external onlyOwner {
        isMember[who] = member;
    }

    function _checkBooking(address booker, uint256 slot) internal virtual override {
        if (!isMember[booker]) revert NotMember(booker);
        super._checkBooking(booker, slot);
    }
}

/// @notice Each booker may hold at most `maxSlots` bookings.
abstract contract SlotLimit is BookingDesk {
    error LimitReached(address booker, uint256 maxSlots);

    uint256 public immutable maxSlots;
    mapping(address => uint256) public slotsOf;

    constructor(uint256 maxSlots_) {
        maxSlots = maxSlots_;
    }

    function _checkBooking(address booker, uint256 slot) internal virtual override {
        if (slotsOf[booker] >= maxSlots) revert LimitReached(booker, maxSlots);
        // If a later rule reverts, the whole booking reverts and this count with it.
        slotsOf[booker]++;
        super._checkBooking(booker, slot);
    }
}

/// @notice The community woodshop's lathe: members only, a few slots each, a flat fee.
contract Woodshop is MembersOnly, SlotLimit {
    uint256 public constant FEE = 0.01 ether;

    constructor(uint256 maxSlots_) SlotLimit(maxSlots_) {}

    function fee() public pure override returns (uint256) {
        return FEE;
    }

    /// @dev Both bases add a rule: super runs SlotLimit's, then MembersOnly's.
    function _checkBooking(address booker, uint256 slot) internal override(MembersOnly, SlotLimit) {
        super._checkBooking(booker, slot);
    }
}
