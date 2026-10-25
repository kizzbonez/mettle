contract BursaryAccessTest is Test {
    BursaryPool pool;
    address committee = makeAddr("committee");

    function setUp() public {
        pool = new BursaryPool(committee);
        vm.deal(address(this), 10 ether);
        pool.donate{value: 10 ether}();
    }

    /// The auditor's proof of concept for H-01: a stranger awards themselves the pool.
    function testFuzz_strangers_cannot_award(address stranger) public {
        vm.assume(stranger != committee);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(BursaryPool.NotCommittee.selector, stranger));
        pool.award(stranger, 10 ether);
        assertEq(pool.awarded(stranger), 0, "a stranger's award after a refused award");
    }

    function test_strangers_cannot_award_equally() public {
        address mallory = makeAddr("mallory");
        address[] memory students = new address[](2);
        students[0] = mallory;
        students[1] = makeAddr("mallorysFriend");
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(BursaryPool.NotCommittee.selector, mallory));
        pool.awardEqually(students, 10 ether);
        assertEq(pool.totalAwarded(), 0, "unclaimed awards after a refused awardEqually");
    }

    function test_the_committee_still_awards() public {
        address ann = makeAddr("ann");
        address[] memory students = new address[](2);
        students[0] = ann;
        students[1] = makeAddr("ben");
        vm.startPrank(committee);
        pool.award(ann, 1 ether);
        pool.awardEqually(students, 4 ether);
        vm.stopPrank();
        assertEq(pool.awarded(ann), 3 ether, "Ann's award after both kinds of award");
        assertEq(pool.available(), 5 ether, "money still available after the awards");
    }

    function test_awards_cannot_exceed_what_is_available() public {
        vm.prank(committee);
        vm.expectRevert(abi.encodeWithSelector(BursaryPool.NotEnoughFunds.selector, 10 ether, 11 ether));
        pool.award(makeAddr("ann"), 11 ether);
    }
}
