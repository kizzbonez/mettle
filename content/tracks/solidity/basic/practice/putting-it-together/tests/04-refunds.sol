// A guest's contract wallet that counts the payments it receives (a storage write, which needs
// more than 2300 gas).
contract GuestWallet {
    uint256 public paymentsReceived;

    function buy(SupperTickets tickets, uint256 seats) external payable {
        tickets.buy{value: msg.value}(seats);
    }

    function refund(SupperTickets tickets) external {
        tickets.claimRefund();
    }

    receive() external payable {
        paymentsReceived += 1;
    }
}

// A buyer that tries to claim its refund a second time from inside the first payment.
contract GreedyGuest {
    SupperTickets public tickets;
    uint256 public timesPaid;

    constructor(SupperTickets tickets_) {
        tickets = tickets_;
    }

    function buy(uint256 seats) external payable {
        tickets.buy{value: msg.value}(seats);
    }

    function refund() external {
        tickets.claimRefund();
    }

    receive() external payable {
        timesPaid += 1;
        if (timesPaid == 1) {
            // Ignore the outcome: if the second claim is refused, the first payment still lands.
            (bool ok,) = address(tickets).call(abi.encodeCall(SupperTickets.claimRefund, ()));
            ok;
        }
    }
}

contract RefundsTest is Test {
    uint256 constant PRICE = 0.02 ether;

    SupperTickets tickets;
    address organiser = address(0x0e6);
    address ada = address(0xA11CE);
    address bo = address(0xB0);

    function setUp() public {
        vm.prank(organiser);
        tickets = new SupperTickets(PRICE, 50);
        vm.deal(ada, 1 ether);
        vm.deal(bo, 1 ether);
    }

    function _cancel() internal {
        vm.prank(organiser);
        tickets.cancel();
    }

    function test_a_refund_is_paid_once() public {
        vm.prank(ada);
        tickets.buy{value: 3 * PRICE}(3);
        _cancel();

        vm.prank(ada);
        tickets.claimRefund();
        assertEq(ada.balance, 1 ether, "the buyer's ether after the refund");
        assertEq(tickets.seatsOf(ada), 0, "seats after the refund");

        vm.prank(ada);
        vm.expectRevert(SupperTickets.NothingToPay.selector);
        tickets.claimRefund();
    }

    function test_non_buyers_get_nothing() public {
        _cancel();
        vm.prank(bo);
        vm.expectRevert(SupperTickets.NothingToPay.selector);
        tickets.claimRefund();
    }

    function test_refund_leaves_the_change_alone() public {
        vm.prank(ada);
        tickets.buy{value: 0.05 ether}(2);
        _cancel();
        vm.prank(ada);
        tickets.claimRefund();
        assertEq(tickets.credit(ada), 0.01 ether, "change still credited after the refund");
        assertEq(address(tickets).balance, 0.01 ether, "ether left for the change");
    }

    function test_refunds_a_wallet_whose_receive_writes_storage() public {
        GuestWallet wallet = new GuestWallet();
        wallet.buy{value: 2 * PRICE}(tickets, 2);
        _cancel();
        wallet.refund(tickets);
        assertEq(address(wallet).balance, 2 * PRICE, "ether refunded to the wallet");
        assertEq(wallet.paymentsReceived(), 1, "payments the wallet counted");
    }

    function test_a_guest_calling_back_is_refunded_once() public {
        vm.prank(bo);
        tickets.buy{value: 4 * PRICE}(4);
        GreedyGuest greedy = new GreedyGuest(tickets);
        greedy.buy{value: PRICE}(1);
        _cancel();

        greedy.refund();
        assertEq(address(greedy).balance, PRICE, "ether the calling-back guest received");
        assertEq(address(tickets).balance, 4 * PRICE, "ether kept for the other guest's refund");

        vm.prank(bo);
        tickets.claimRefund();
        assertEq(bo.balance, 1 ether, "the other guest's ether after the refund");
    }

    function testFuzz_everyone_gets_back_what_they_paid(uint256 adaSeats, uint256 boSeats, uint256 extra) public {
        adaSeats = bound(adaSeats, 1, 25);
        boSeats = bound(boSeats, 1, 25);
        extra = bound(extra, 0, 0.1 ether);

        vm.prank(ada);
        tickets.buy{value: adaSeats * PRICE + extra}(adaSeats);
        vm.prank(bo);
        tickets.buy{value: boSeats * PRICE}(boSeats);
        _cancel();

        vm.prank(ada);
        tickets.claimRefund();
        vm.prank(bo);
        tickets.claimRefund();
        if (extra > 0) {
            vm.prank(ada);
            tickets.withdrawCredit();
        }

        assertEq(ada.balance, 1 ether, "the first buyer's ether at the end");
        assertEq(bo.balance, 1 ether, "the second buyer's ether at the end");
        assertEq(address(tickets).balance, 0, "ether left in the sale");
    }
}
