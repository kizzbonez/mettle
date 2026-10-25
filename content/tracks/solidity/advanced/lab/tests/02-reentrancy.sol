/// Deposits 1 ether, withdraws it, and withdraws again from inside the payment it receives.
contract ReentrantSaver {
    SavingsPool immutable pool;
    uint256 public reentries;

    constructor(SavingsPool pool_) payable {
        pool = pool_;
    }

    function attack() external {
        pool.deposit{value: 1 ether}();
        pool.withdraw(1 ether);
    }

    receive() external payable {
        if (address(pool).balance >= 1 ether) {
            reentries++;
            pool.withdraw(1 ether);
        }
    }
}

contract ReentrancyTest is Test {
    event Withdrawn(address indexed member, uint256 assets, uint256 shares);

    address treasurer = makeAddr("treasurer");
    address alice = makeAddr("alice");
    SavingsPool pool;

    function setUp() public {
        pool = new SavingsPool(treasurer);
        vm.deal(alice, 5 ether);
        vm.prank(alice);
        pool.deposit{value: 5 ether}();
    }

    function test_a_reentrant_withdrawal_cannot_drain_the_pool() public {
        ReentrantSaver attacker = new ReentrantSaver{value: 1 ether}(pool);
        try attacker.attack() {} catch {}
        assertGe(address(pool).balance, 5 ether, "the ether left in the pool after the reentrancy attack");
        assertLe(address(attacker).balance, 1 ether, "the ether the attacker holds after the attack");
        assertEq(pool.assetsOf(alice), 5 ether, "alice's savings after the attack");

        vm.prank(alice);
        pool.withdraw(5 ether);
        assertEq(alice.balance, 5 ether, "the ether alice withdrew after the attack");
    }

    function test_a_member_withdraws_in_parts() public {
        vm.expectEmit(address(pool));
        emit Withdrawn(alice, 2 ether, 2 ether);
        vm.prank(alice);
        pool.withdraw(2 ether);
        vm.prank(alice);
        pool.withdraw(3 ether);
        assertEq(alice.balance, 5 ether, "the ether alice withdrew in two parts");
        assertEq(pool.sharesOf(alice), 0, "alice's shares after withdrawing everything");
        assertEq(pool.totalAssets(), 0, "the pool's assets after alice left");
    }

    function testFuzz_the_books_match_the_ether(uint96 deposit, uint96 withdrawal) public {
        address bob = makeAddr("bob");
        vm.deal(bob, deposit);
        vm.assume(deposit > 0);
        vm.prank(bob);
        pool.deposit{value: deposit}();
        uint256 amount = bound(withdrawal, 0, deposit);
        vm.prank(bob);
        pool.withdraw(amount);
        assertEq(address(pool).balance, pool.totalAssets(), "the pool's ether against its recorded assets");
        assertEq(bob.balance, amount, "the ether bob withdrew");
    }
}
