// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Seats for one puppet show
/// @notice Anyone can buy a numbered seat before the show. If the organiser cancels the show,
/// every holder gets their ticket money back; otherwise the organiser collects it once the show
/// has started.
contract PuppetShow {
    uint256 public constant PRICE = 0.05 ether;
    uint256 public constant SEATS = 40;

    address public immutable organiser;
    uint256 public immutable showStarts;

    bool public cancelled;
    bool public collected;
    uint256 public sold;
    mapping(uint256 seat => address holder) public holderOf;

    event TicketSold(address indexed buyer, uint256 indexed seat);
    event ShowCancelled();
    event Refunded(address indexed holder, uint256 seats, uint256 amount);
    event Collected(address indexed to, uint256 amount);

    error NotOrganiser(address caller);
    error SalesClosed();
    error NoSuchSeat(uint256 seat);
    error SeatTaken(uint256 seat);
    error WrongPayment(uint256 sent);
    error TooLateToCancel();
    error NotCancelled();
    error NotYourSeat(uint256 seat);
    error ShowWasCancelled();
    error ShowNotStarted();
    error AlreadyCollected();
    error PaymentFailed();

    constructor(uint256 showStarts_) {
        organiser = msg.sender;
        showStarts = showStarts_;
    }

    modifier onlyOrganiser() {
        if (msg.sender != organiser) revert NotOrganiser(msg.sender);
        _;
    }

    /// @notice Buys `seat` for exactly `PRICE`, while the show is on sale.
    function buy(uint256 seat) external payable {
        if (cancelled || block.timestamp >= showStarts) revert SalesClosed();
        if (seat >= SEATS) revert NoSuchSeat(seat);
        if (holderOf[seat] != address(0)) revert SeatTaken(seat);
        if (msg.value != PRICE) revert WrongPayment(msg.value);
        holderOf[seat] = msg.sender;
        sold += 1;
        emit TicketSold(msg.sender, seat);
    }

    /// @notice Cancels the show. Only before it starts: once the organiser may collect, the
    /// ticket money can no longer be promised back to the holders.
    function cancelShow() external onlyOrganiser {
        if (block.timestamp >= showStarts) revert TooLateToCancel();
        cancelled = true;
        emit ShowCancelled();
    }

    /// @notice After a cancellation, refunds the caller's `seats` at `PRICE` each.
    function refund(uint256[] calldata seats) external {
        if (!cancelled) revert NotCancelled();
        for (uint256 i = 0; i < seats.length; i++) {
            uint256 seat = seats[i];
            if (holderOf[seat] != msg.sender) revert NotYourSeat(seat);
            // Clear the seat in the same step as the check, so a seat listed twice fails
            // the check the second time.
            delete holderOf[seat];
        }
        uint256 amount = seats.length * PRICE;
        sold -= seats.length;
        emit Refunded(msg.sender, seats.length, amount);
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }

    /// @notice Sends the takings to `to`, once, after the show has started and only if it was
    /// not cancelled.
    function collect(address to) external onlyOrganiser {
        if (cancelled) revert ShowWasCancelled();
        if (block.timestamp < showStarts) revert ShowNotStarted();
        if (collected) revert AlreadyCollected();
        collected = true;
        uint256 amount = sold * PRICE;
        emit Collected(to, amount);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
}
