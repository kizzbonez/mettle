/// A painter whose wallet refuses ether.
contract RefusingWallet {
    receive() external payable {
        revert("refused");
    }

    function withdrawFrom(MuralPot pot) external {
        pot.withdraw();
    }
}

/// A painter whose wallet tries to withdraw a second time while it is being paid.
contract GreedyWallet {
    MuralPot public pot;
    uint256 public calls;

    function withdrawFrom(MuralPot pot_) external {
        pot = pot_;
        pot.withdraw();
    }

    receive() external payable {
        calls++;
        if (calls == 1) {
            try pot.withdraw() {} catch {}
        }
    }
}

contract MuralPullPaymentsTest is Test {
    function _fundedPot(address[] memory painters) internal returns (MuralPot pot) {
        pot = new MuralPot(painters, 3 ether, block.timestamp + 7 days);
        hoax(makeAddr("backer"), 3 ether);
        pot.pledge{value: 3 ether}();
        vm.warp(block.timestamp + 7 days);
    }

    function test_a_refusing_painter_only_blocks_itself() public {
        RefusingWallet refuser = new RefusingWallet();
        address[] memory painters = new address[](3);
        painters[0] = makeAddr("lead");
        painters[1] = address(refuser);
        painters[2] = makeAddr("third");
        MuralPot pot = _fundedPot(painters);
        pot.finish();

        vm.expectRevert(abi.encodeWithSelector(MuralPot.TransferFailed.selector, address(refuser)));
        refuser.withdrawFrom(pot);

        vm.prank(painters[0]);
        pot.withdraw();
        vm.prank(painters[2]);
        pot.withdraw();
        assertEq(painters[0].balance, 1 ether, "the lead painter's balance");
        assertEq(painters[2].balance, 1 ether, "the third painter's balance");
        assertEq(pot.owed(address(refuser)), 1 ether, "the refusing painter's share, still owed");
    }

    function test_a_painter_cannot_withdraw_twice() public {
        address[] memory painters = new address[](2);
        painters[0] = makeAddr("lead");
        painters[1] = makeAddr("second");
        MuralPot pot = _fundedPot(painters);
        vm.startPrank(painters[1]);
        pot.withdraw();
        vm.expectRevert(abi.encodeWithSelector(MuralPot.NothingToWithdraw.selector, painters[1]));
        pot.withdraw();
        vm.stopPrank();
    }

    function test_a_callback_cannot_take_a_share_twice() public {
        GreedyWallet greedy = new GreedyWallet();
        address[] memory painters = new address[](3);
        painters[0] = makeAddr("lead");
        painters[1] = address(greedy);
        painters[2] = makeAddr("third");
        MuralPot pot = _fundedPot(painters);
        greedy.withdrawFrom(pot);
        assertEq(address(greedy).balance, 1 ether, "what a painter that calls back collects");
        assertEq(address(pot).balance, 2 ether, "the ether left for the other painters");
    }

    function test_backers_of_a_failed_pot_take_back_exactly_their_pledges() public {
        address[] memory painters = new address[](1);
        painters[0] = makeAddr("lead");
        MuralPot pot = new MuralPot(painters, 10 ether, block.timestamp + 7 days);
        address ana = makeAddr("ana");
        address ben = makeAddr("ben");
        hoax(ana, 5 ether);
        pot.pledge{value: 2 ether}();
        hoax(ben, 5 ether);
        pot.pledge{value: 3 ether}();
        vm.warp(block.timestamp + 7 days);

        vm.prank(ana);
        pot.refund();
        assertEq(ana.balance, 5 ether, "ana's balance after her refund");
        vm.prank(ana);
        vm.expectRevert(abi.encodeWithSelector(MuralPot.NothingToWithdraw.selector, ana));
        pot.refund();

        vm.prank(ben);
        pot.refund();
        assertEq(ben.balance, 5 ether, "ben's balance after his refund");
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(MuralPot.NothingToWithdraw.selector, stranger));
        pot.refund();
    }
}
