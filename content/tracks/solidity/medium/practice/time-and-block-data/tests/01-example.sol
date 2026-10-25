contract BonusExampleTest is Test {
    event Released(address indexed to, uint256 amount);

    function test_example() public {
        address cal = makeAddr("cal");
        uint256 start = 1_767_225_600; // 2026-01-01 00:00:00 UTC
        vm.warp(start);
        ApprenticeBonus bonus = new ApprenticeBonus{value: 5.2 ether}(cal, start, 13 weeks, 52 weeks);

        assertEq(bonus.vestedAt(start + 13 weeks - 1), 0, "vested one second before the cliff");
        assertEq(bonus.vestedAt(start + 13 weeks), 1.3 ether, "vested at the cliff");
        assertEq(bonus.vestedAt(start + 26 weeks), 2.6 ether, "vested half-way through");
        assertEq(bonus.vestedAt(start + 60 weeks), 5.2 ether, "vested after the end");

        vm.warp(start + 13 weeks - 1);
        vm.prank(cal);
        vm.expectRevert(ApprenticeBonus.NothingToRelease.selector);
        bonus.release();

        vm.warp(start + 13 weeks);
        assertEq(bonus.releasable(), 1.3 ether, "releasable at the cliff");
        vm.expectEmit(address(bonus));
        emit Released(cal, 1.3 ether);
        vm.prank(cal);
        bonus.release();
        assertEq(cal.balance, 1.3 ether, "cal's balance after the first release");

        skip(3 days);
        vm.prank(cal);
        vm.expectRevert(abi.encodeWithSelector(ApprenticeBonus.TooSoon.selector, start + 14 weeks));
        bonus.release();

        vm.warp(start + 52 weeks);
        vm.prank(cal);
        bonus.release();
        assertEq(cal.balance, 5.2 ether, "cal's balance once everything has vested");
        assertEq(address(bonus).balance, 0, "ether left in the contract at the end");
    }
}
