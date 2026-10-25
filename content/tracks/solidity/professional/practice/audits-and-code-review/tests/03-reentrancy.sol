/// The auditor's proof of concept for H-02: a student whose wallet claims again while it is
/// being paid. `rounds` is how many times it re-enters.
contract BursaryReentrantStudent {
    BursaryPool public pool;
    uint256 public rounds;

    constructor(BursaryPool pool_, uint256 rounds_) {
        pool = pool_;
        rounds = rounds_;
    }

    function start() external {
        pool.claim();
    }

    receive() external payable {
        if (rounds > 0) {
            rounds--;
            try pool.claim() {} catch {}
        }
    }
}

contract BursaryReentrancyTest is Test {
    BursaryPool pool;
    address committee = makeAddr("committee");
    address ann = makeAddr("ann");
    address ben = makeAddr("ben");

    function setUp() public {
        pool = new BursaryPool(committee);
        vm.deal(address(this), 10 ether);
        pool.donate{value: 10 ether}();
        vm.startPrank(committee);
        pool.award(ann, 3 ether);
        pool.award(ben, 3 ether);
        vm.stopPrank();
    }

    function test_a_reentrant_claim_gets_only_its_own_award() public {
        BursaryReentrantStudent attacker = new BursaryReentrantStudent(pool, 6);
        vm.prank(committee);
        pool.award(address(attacker), 1 ether);

        attacker.start();
        assertEq(address(attacker).balance, 1 ether, "what the reentrant student received");
        assertEq(address(pool).balance, 9 ether, "the pool's balance after the attack");
        assertEq(pool.totalAwarded(), 6 ether, "unclaimed awards after the attack");
    }

    function test_honest_students_can_still_claim_after_an_attack() public {
        BursaryReentrantStudent attacker = new BursaryReentrantStudent(pool, 6);
        vm.prank(committee);
        pool.award(address(attacker), 1 ether);
        attacker.start();

        vm.prank(ann);
        pool.claim();
        vm.prank(ben);
        pool.claim();
        assertEq(ann.balance + ben.balance, 6 ether, "what Ann and Ben received");
        assertEq(pool.available(), 3 ether, "money still available at the end");
    }

    function test_a_second_claim_has_nothing_to_claim() public {
        vm.startPrank(ann);
        pool.claim();
        vm.expectRevert(BursaryPool.NothingToClaim.selector);
        pool.claim();
        vm.stopPrank();
    }
}
