// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Harvest supper tickets
/// @notice Guests buy seats at a fixed price. If the supper is cancelled, every guest takes their
/// money back; otherwise the organiser collects the takings once sales end.
contract SupperTickets {
    enum Stage {
        OnSale,
        Cancelled,
        Collected
    }

    address public immutable organiser;
    /// @notice The price of one seat, in wei.
    uint256 public immutable price;
    /// @notice How many seats the hall has.
    uint256 public immutable capacity;

    Stage public stage;
    uint256 public seatsSold;
    mapping(address => uint256) public seatsOf;
    /// @notice Change owed to each buyer who paid more than the cost, to withdraw at any time.
    mapping(address => uint256) public credit;

    event TicketsBought(address indexed buyer, uint256 seats, uint256 cost);
    event SaleCancelled();
    event Refunded(address indexed buyer, uint256 amount);
    event CreditWithdrawn(address indexed buyer, uint256 amount);
    event TakingsCollected(uint256 amount);

    error NotOrganiser(address caller);
    error WrongStage(Stage current);
    error ZeroSeats();
    error NotEnoughSeats(uint256 requested, uint256 available);
    error Underpaid(uint256 sent, uint256 cost);
    error NothingToPay();
    error TransferFailed(address to, uint256 amount);

    constructor(uint256 price_, uint256 capacity_) {
        organiser = msg.sender;
        price = price_;
        capacity = capacity_;
    }

    modifier onlyOrganiser() {
        if (msg.sender != organiser) revert NotOrganiser(msg.sender);
        _;
    }

    modifier atStage(Stage expected) {
        if (stage != expected) revert WrongStage(stage);
        _;
    }

    /// @notice Buy `seats` seats; anything paid above the cost is credited to you.
    /// @dev Checks in the documented order, then records the sale. No ether leaves here.
    function buy(uint256 seats) external payable atStage(Stage.OnSale) {
        if (seats == 0) revert ZeroSeats();
        uint256 available = capacity - seatsSold;
        if (seats > available) revert NotEnoughSeats(seats, available);
        uint256 cost = seats * price;
        if (msg.value < cost) revert Underpaid(msg.value, cost);

        seatsSold += seats;
        seatsOf[msg.sender] += seats;
        credit[msg.sender] += msg.value - cost;
        emit TicketsBought(msg.sender, seats, cost);
    }

    /// @notice Call the supper off; every guest can then claim a refund.
    function cancel() external onlyOrganiser atStage(Stage.OnSale) {
        stage = Stage.Cancelled;
        emit SaleCancelled();
    }

    /// @notice After a cancellation, take back what you paid for your seats.
    /// @dev Effects before the interaction: the seats are cleared before any ether is sent, so a
    /// buyer that calls back in finds nothing left to refund.
    function claimRefund() external atStage(Stage.Cancelled) {
        uint256 amount = seatsOf[msg.sender] * price;
        if (amount == 0) revert NothingToPay();
        seatsOf[msg.sender] = 0;
        _pay(msg.sender, amount);
        emit Refunded(msg.sender, amount);
    }

    /// @notice Take out the change credited to you, at any stage.
    function withdrawCredit() external {
        uint256 amount = credit[msg.sender];
        if (amount == 0) revert NothingToPay();
        credit[msg.sender] = 0;
        _pay(msg.sender, amount);
        emit CreditWithdrawn(msg.sender, amount);
    }

    /// @notice End the sale and pay the organiser for every seat sold, once.
    function collectTakings() external onlyOrganiser atStage(Stage.OnSale) {
        stage = Stage.Collected;
        uint256 amount = seatsSold * price;
        _pay(organiser, amount);
        emit TakingsCollected(amount);
    }

    function _pay(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }
}
