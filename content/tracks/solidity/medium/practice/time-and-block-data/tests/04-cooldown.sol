contract BonusCooldownTest is Test {
    address cal = address(0xCA1);

    function test_the_first_release_does_not_wait() public {
        // A fresh test chain starts at timestamp 1, like a schedule that starts "now".
        uint256 start = block.timestamp;
        vm.deal(address(this), 3 ether);
        ApprenticeBonus bonus = new ApprenticeBonus{value: 3 ether}(cal, start, 0, 30 days);
        vm.warp(start + 2 days);
        vm.prank(cal);
        bonus.release();
        assertEq(cal.balance, 0.2 ether, "paid by a first release two days in");
        assertEq(bonus.lastRelease(), start + 2 days, "lastRelease after the first release");
    }

    function test_a_week_between_releases() public {
        uint256 start = 1_767_225_600;
        vm.warp(start);
        vm.deal(address(this), 10 ether);
        ApprenticeBonus bonus = new ApprenticeBonus{value: 10 ether}(cal, start, 0, 100 days);

        vm.warp(start + 10 days);
        vm.prank(cal);
        bonus.release();

        vm.warp(start + 17 days - 1);
        vm.roll(block.number + 50_000);
        vm.prank(cal);
        vm.expectRevert(abi.encodeWithSelector(ApprenticeBonus.TooSoon.selector, start + 17 days));
        bonus.release();

        vm.warp(start + 17 days);
        vm.prank(cal);
        bonus.release();
        assertEq(bonus.released(), 1.7 ether, "released after two releases a week apart");
    }

    function test_the_cooldown_comes_before_nothing_to_release() public {
        uint256 start = 1_767_225_600;
        vm.warp(start);
        vm.deal(address(this), 1 ether);
        ApprenticeBonus bonus = new ApprenticeBonus{value: 1 ether}(cal, start, 0, 10 days);

        vm.warp(start + 10 days);
        vm.prank(cal);
        bonus.release(); // everything

        skip(3 days);
        vm.prank(cal);
        vm.expectRevert(abi.encodeWithSelector(ApprenticeBonus.TooSoon.selector, start + 17 days));
        bonus.release();

        skip(5 days);
        vm.prank(cal);
        vm.expectRevert(ApprenticeBonus.NothingToRelease.selector);
        bonus.release();
    }
}
