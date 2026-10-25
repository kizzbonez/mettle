contract ShowTimelineTest is Test {
    event Collected(address indexed to, uint256 amount);

    PuppetShow show;
    address organiser = makeAddr("organiser");
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    address mallory = makeAddr("mallory");

    function setUp() public {
        vm.warp(1_000_000);
        vm.prank(organiser);
        show = new PuppetShow(1_000_000 + 7 days);
        hoax(ada, 1 ether);
        show.buy{value: 0.05 ether}(7);
        vm.deal(ben, 1 ether);
        vm.startPrank(ben);
        show.buy{value: 0.05 ether}(8);
        show.buy{value: 0.05 ether}(9);
        vm.stopPrank();
    }

    function seat(uint256 s) internal pure returns (uint256[] memory list) {
        list = new uint256[](1);
        list[0] = s;
    }

    function test_strangers_cannot_collect() public {
        vm.warp(show.showStarts());
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.NotOrganiser.selector, mallory));
        show.collect(mallory);
    }

    function test_attack_organiser_collects_early_then_cancels() public {
        vm.prank(organiser);
        try show.collect(organiser) {} catch {}
        vm.prank(organiser);
        show.cancelShow();
        vm.prank(ada);
        try show.refund(seat(7)) {} catch {}

        assertEq(organiser.balance, 0, "ether the organiser took before the show");
        assertEq(ada.balance, 1 ether, "ada's ether after her refund for the cancelled show");
    }

    function test_attack_organiser_collects_then_cancels_after_the_start() public {
        vm.warp(show.showStarts() + 1 hours);
        vm.prank(organiser);
        show.collect(organiser);

        vm.prank(organiser);
        try show.cancelShow() {} catch {}
        assertFalse(show.cancelled(), "whether the show can be cancelled after the organiser collected");
    }

    function test_cannot_cancel_once_the_show_starts() public {
        vm.warp(show.showStarts());
        vm.prank(organiser);
        vm.expectRevert(PuppetShow.TooLateToCancel.selector);
        show.cancelShow();
    }

    function test_cannot_collect_before_the_show_starts() public {
        vm.warp(show.showStarts() - 1);
        vm.prank(organiser);
        vm.expectRevert(PuppetShow.ShowNotStarted.selector);
        show.collect(organiser);
    }

    function test_collects_the_takings_once_when_the_show_starts() public {
        vm.warp(show.showStarts());
        vm.expectEmit(address(show));
        emit Collected(organiser, 0.15 ether);
        vm.prank(organiser);
        show.collect(organiser);
        assertEq(organiser.balance, 0.15 ether, "the organiser's takings");

        vm.prank(organiser);
        vm.expectRevert(PuppetShow.AlreadyCollected.selector);
        show.collect(organiser);
    }

    function test_cannot_collect_after_a_cancellation() public {
        vm.prank(organiser);
        show.cancelShow();
        vm.warp(show.showStarts() + 1 days);
        vm.prank(organiser);
        vm.expectRevert(PuppetShow.ShowWasCancelled.selector);
        show.collect(organiser);
    }
}
