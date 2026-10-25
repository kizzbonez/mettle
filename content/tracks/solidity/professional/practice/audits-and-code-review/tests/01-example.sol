contract BursaryExampleTest is Test {
    function test_example() public {
        address committee = makeAddr("committee");
        address ann = makeAddr("ann");
        address mallory = makeAddr("mallory");
        BursaryPool pool = new BursaryPool(committee);
        vm.deal(address(this), 10 ether);
        pool.donate{value: 10 ether}();

        vm.prank(committee);
        pool.award(ann, 3 ether);
        assertEq(pool.available(), 7 ether, "money still available after an award of 3 ether");

        vm.prank(ann);
        pool.claim();
        assertEq(ann.balance, 3 ether, "Ann's balance after claiming");
        assertEq(pool.totalAwarded(), 0, "unclaimed awards after Ann claimed");

        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(BursaryPool.NotCommittee.selector, mallory));
        pool.award(mallory, 7 ether);
    }
}
