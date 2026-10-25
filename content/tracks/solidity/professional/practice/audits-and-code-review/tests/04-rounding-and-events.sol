contract BursaryRoundingEventsTest is Test {
    event CommitteeChanged(address indexed previous, address indexed next);
    event Awarded(address indexed student, uint256 amount);

    BursaryPool pool;
    address committee = makeAddr("committee");

    function setUp() public {
        pool = new BursaryPool(committee);
        vm.deal(address(this), 1 ether);
        pool.donate{value: 1 ether}();
    }

    function _three() internal returns (address[] memory students) {
        students = new address[](3);
        students[0] = makeAddr("ann");
        students[1] = makeAddr("ben");
        students[2] = makeAddr("cat");
    }

    function test_the_remainder_stays_available() public {
        address[] memory students = _three();
        vm.prank(committee);
        pool.awardEqually(students, 100);
        assertEq(pool.awarded(students[2]), 33, "each student's share of 100 wei split three ways");
        assertEq(pool.totalAwarded(), 99, "unclaimed awards after splitting 100 wei three ways");
        assertEq(pool.available(), 1 ether - 99, "money still available after the split");
    }

    function testFuzz_every_award_can_be_claimed(uint96 total) public {
        total = uint96(bound(total, 0, 1 ether));
        address[] memory students = _three();
        vm.prank(committee);
        pool.awardEqually(students, total);
        for (uint256 i = 0; i < 3; i++) {
            if (pool.awarded(students[i]) == 0) continue;
            vm.prank(students[i]);
            pool.claim();
        }
        assertEq(pool.totalAwarded(), 0, "unclaimed awards once every student claimed");
        assertEq(pool.available(), address(pool).balance, "available money once every student claimed");
    }

    function test_setCommittee_announces_the_change() public {
        address next = makeAddr("newCommittee");
        vm.expectEmit(address(pool));
        emit CommitteeChanged(committee, next);
        pool.setCommittee(next);
        assertEq(pool.committee(), next, "the committee after the change");
    }

    function test_setCommittee_rejects_the_zero_address() public {
        vm.expectRevert(BursaryPool.ZeroAddress.selector);
        pool.setCommittee(address(0));
        assertEq(pool.committee(), committee, "the committee after a refused change");
    }

    function test_only_the_owner_changes_the_committee() public {
        vm.prank(committee);
        vm.expectRevert(abi.encodeWithSelector(BursaryPool.NotOwner.selector, committee));
        pool.setCommittee(committee);
    }
}
