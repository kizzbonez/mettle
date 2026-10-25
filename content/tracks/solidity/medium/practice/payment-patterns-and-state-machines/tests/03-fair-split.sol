contract MuralSplitTest is Test {
    function _painters(uint256 n) internal returns (address[] memory painters) {
        painters = new address[](n);
        for (uint256 i = 0; i < n; i++) {
            painters[i] = makeAddr(string.concat("painter", vm.toString(i)));
        }
    }

    function testFuzz_shares_add_up_to_the_pledges(uint256 n, uint256 a, uint256 b) public {
        n = bound(n, 1, 6);
        a = bound(a, 1, 50 ether);
        b = bound(b, 1, 50 ether);
        address[] memory painters = _painters(n);
        MuralPot pot = new MuralPot(painters, 1, block.timestamp + 1 days);
        hoax(makeAddr("first backer"), a);
        pot.pledge{value: a}();
        hoax(makeAddr("second backer"), b);
        pot.pledge{value: b}();
        vm.warp(block.timestamp + 1 days);
        pot.finish();

        uint256 total = a + b;
        uint256 sum;
        for (uint256 i = 0; i < n; i++) {
            sum += pot.owed(painters[i]);
        }
        assertEq(sum, total, "the painters' shares added together");
        assertEq(pot.owed(painters[0]), total / n + total % n, "the lead painter's share");
        assertEq(pot.owed(painters[n - 1]), total / n, "the last painter's share");
    }

    function test_one_painter_gets_everything() public {
        address[] memory painters = _painters(1);
        MuralPot pot = new MuralPot(painters, 1 ether, block.timestamp + 1 days);
        hoax(makeAddr("backer"), 5 ether);
        pot.pledge{value: 3 ether + 7}();
        vm.warp(block.timestamp + 1 days);
        pot.finish();
        assertEq(pot.owed(painters[0]), 3 ether + 7, "a single painter's share");
    }

    function test_seven_wei_among_three_painters() public {
        address[] memory painters = _painters(3);
        MuralPot pot = new MuralPot(painters, 7, block.timestamp + 1 days);
        hoax(makeAddr("backer"), 1 ether);
        pot.pledge{value: 7}();
        vm.warp(block.timestamp + 1 days);
        pot.finish();
        assertEq(pot.owed(painters[0]), 3, "the lead painter's share of 7 wei");
        assertEq(pot.owed(painters[1]), 2, "the second painter's share of 7 wei");
        assertEq(pot.owed(painters[2]), 2, "the third painter's share of 7 wei");
    }
}
