contract PuppetShowExampleTest is Test {
    event Refunded(address indexed holder, uint256 seats, uint256 amount);

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

    function twoSeats(uint256 a, uint256 b) internal pure returns (uint256[] memory list) {
        list = new uint256[](2);
        list[0] = a;
        list[1] = b;
    }

    function test_example_cancel_and_refund() public {
        vm.prank(organiser);
        show.cancelShow();

        vm.expectEmit(address(show));
        emit Refunded(ben, 2, 0.1 ether);
        vm.prank(ben);
        show.refund(twoSeats(8, 9));

        assertEq(ben.balance, 1 ether, "ben's ether after refunding both of his seats");
        assertEq(show.sold(), 1, "seats still sold after ben's refund");
        assertEq(show.holderOf(8), address(0), "the holder of seat 8 after its refund");
    }

    /// An attack test: mallory holds no role at all. Each step is something anyone may try;
    /// the assertions at the end are the invariant that must survive it.
    function test_attack_a_stranger_collects_the_takings() public {
        vm.warp(show.showStarts());
        vm.prank(mallory);
        try show.collect(mallory) {} catch {}

        assertEq(mallory.balance, 0, "ether a stranger collected");
        assertEq(address(show).balance, 0.15 ether, "ticket money still held by the contract");
    }
}
