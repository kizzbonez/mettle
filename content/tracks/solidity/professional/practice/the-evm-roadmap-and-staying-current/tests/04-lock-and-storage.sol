/// A member whose wallet calls withdraw again while it is being paid, and records what happened.
contract LockerReentrantMember {
    LockerDeposits public box;
    bool public innerSucceeded;
    bytes public innerError;
    bool private entered;

    constructor(LockerDeposits box_) payable {
        box = box_;
    }

    function start() external {
        box.deposit{value: 2 ether}();
        box.withdraw(1 ether);
    }

    receive() external payable {
        if (entered) return;
        entered = true;
        try box.withdraw(1 ether) {
            innerSucceeded = true;
        } catch (bytes memory reason) {
            innerError = reason;
        }
    }
}

contract LockerLockTest is Test {
    LockerDeposits box;
    address ann = makeAddr("ann");

    function setUp() public {
        vm.prank(makeAddr("clubOwner"));
        box = new LockerDeposits();
        vm.deal(ann, 5 ether);
    }

    function test_a_reentrant_withdrawal_is_refused() public {
        LockerReentrantMember member = new LockerReentrantMember{value: 2 ether}(box);
        member.start();
        assertFalse(member.innerSucceeded(), "a withdraw made while another withdraw was paying succeeded");
        assertEq(
            member.innerError(),
            abi.encodeWithSelector(LockerDeposits.Reentrant.selector),
            "the error of the reentrant withdraw"
        );
        assertEq(box.deposits(address(member)), 1 ether, "the member's deposit after one withdrawal");
    }

    function test_withdraw_writes_only_the_deposit_to_storage() public {
        vm.prank(ann);
        box.deposit{value: 1 ether}();
        vm.record();
        vm.prank(ann);
        box.withdraw(0.25 ether);
        (, bytes32[] memory writes) = vm.accesses(address(box));
        assertEq(writes.length, 1, "storage writes made by one withdraw (the lock must be transient)");
    }

    function test_two_withdrawals_in_a_row() public {
        vm.startPrank(ann);
        box.deposit{value: 1 ether}();
        box.withdraw(0.5 ether);
        box.withdraw(0.5 ether);
        vm.stopPrank();
        assertEq(box.deposits(ann), 0, "Ann's deposit after two withdrawals");
    }
}
