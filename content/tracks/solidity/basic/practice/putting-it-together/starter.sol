// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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

    // Task 1
    function buy(uint256 seats) external payable atStage(Stage.OnSale) {
        revert("not implemented: buy");
    }

    // Task 2: add the right modifiers, then write the body.
    function cancel() external {
        revert("not implemented: cancel");
    }

    // Task 3: add the right modifier, then write the body.
    function claimRefund() external {
        revert("not implemented: claimRefund");
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
