import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

/// A token with a transfer hook that calls back into the auction while it moves tokens.
contract HookedCredit {
    mapping(address => uint256) public balanceOf;
    FishAuction public target;
    bytes public callback;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function arm(FishAuction target_, bytes calldata callback_) external {
        target = target_;
        callback = callback_;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        _hook();
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        _hook();
        return true;
    }

    function _hook() internal {
        if (callback.length == 0) return;
        bytes memory data = callback;
        delete callback;
        (bool ok, bytes memory reason) = address(target).call(data);
        if (!ok) {
            assembly {
                revert(add(reason, 32), mload(reason))
            }
        }
    }
}

contract WithdrawalsTest is Test {
    event Withdrawn(address indexed account, uint256 amount);

    address master = makeAddr("harbour master");
    address skipper = makeAddr("skipper");
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    address cy = makeAddr("cy");

    function _market() internal returns (HarbourCredit credit, FishAuction auction) {
        credit = new HarbourCredit(master);
        auction = new FishAuction(credit, master, Bps.wrap(250));
        address[3] memory buyers = [ada, ben, cy];
        for (uint256 i = 0; i < buyers.length; i++) {
            vm.prank(master);
            credit.mint(buyers[i], 10_000e18);
            vm.prank(buyers[i]);
            credit.approve(address(auction), type(uint256).max);
        }
    }

    function test_nothing_to_withdraw() public {
        (, FishAuction auction) = _market();
        vm.prank(ada);
        vm.expectRevert(FishAuction.NothingToWithdraw.selector);
        auction.withdraw();
    }

    function test_a_withdrawal_pays_once_and_is_announced() public {
        (HarbourCredit credit, FishAuction auction) = _market();
        vm.prank(skipper);
        uint256 id = auction.list(1e18, 1 hours);
        vm.prank(ada);
        auction.bid(id, 10e18);
        vm.prank(ben);
        auction.bid(id, 20e18);

        vm.expectEmit(address(auction));
        emit Withdrawn(ada, 10e18);
        vm.prank(ada);
        auction.withdraw();
        assertEq(credit.balanceOf(ada), 10_000e18, "ada's HBC after withdrawing her outbid bid");
        assertEq(auction.withdrawable(ada), 0, "ada's credit after withdrawing");
        vm.prank(ada);
        vm.expectRevert(FishAuction.NothingToWithdraw.selector);
        auction.withdraw();
    }

    function testFuzz_every_credit_is_paid_and_nothing_is_left(uint256 a, uint256 b, uint256 c, uint16 feeBps) public {
        (HarbourCredit credit, FishAuction auction) = _market();
        vm.prank(master);
        auction.setFee(Bps.wrap(uint16(bound(feeBps, 0, 1_000))));
        a = bound(a, 1, 1_000e18);
        b = bound(b, a + a * 500 / 10_000 + 1, 2_000e18);
        c = bound(c, b + b * 500 / 10_000 + 1, 4_000e18);

        vm.prank(skipper);
        uint256 id = auction.list(1, 1 hours);
        vm.prank(ada);
        auction.bid(id, a);
        vm.prank(ben);
        auction.bid(id, b);
        vm.prank(cy);
        auction.bid(id, c);
        vm.warp(block.timestamp + 1 hours);
        auction.settle(id);

        address[5] memory everyone = [ada, ben, cy, skipper, master];
        for (uint256 i = 0; i < everyone.length; i++) {
            if (auction.withdrawable(everyone[i]) > 0) {
                vm.prank(everyone[i]);
                auction.withdraw();
            }
        }
        assertEq(credit.balanceOf(address(auction)), 0, "the HBC left in the auction");
        assertEq(credit.balanceOf(ada), 10_000e18, "ada's HBC after being outbid");
        assertEq(credit.balanceOf(ben), 10_000e18, "ben's HBC after being outbid");
        assertEq(credit.balanceOf(cy), 10_000e18 - c, "the winner's HBC");
        assertEq(credit.balanceOf(skipper) + credit.balanceOf(master), c, "the seller's and the harbour's HBC together");
    }

    function test_a_token_cannot_call_back_into_withdraw_during_a_bid() public {
        HookedCredit hooked = new HookedCredit();
        FishAuction auction = new FishAuction(IERC20(address(hooked)), master, Bps.wrap(250));
        hooked.mint(ada, 100e18);
        vm.prank(skipper);
        uint256 id = auction.list(1e18, 1 hours);
        hooked.arm(auction, abi.encodeCall(FishAuction.withdraw, ()));
        vm.prank(ada);
        vm.expectRevert(ReentrancyGuardTransient.ReentrancyGuardReentrantCall.selector);
        auction.bid(id, 10e18);
    }

    function test_a_token_cannot_call_back_into_bid_during_a_withdrawal() public {
        HookedCredit hooked = new HookedCredit();
        FishAuction auction = new FishAuction(IERC20(address(hooked)), master, Bps.wrap(250));
        hooked.mint(ada, 100e18);
        hooked.mint(ben, 100e18);
        vm.prank(skipper);
        uint256 id = auction.list(1e18, 1 hours);
        vm.prank(ada);
        auction.bid(id, 10e18);
        vm.prank(ben);
        auction.bid(id, 20e18);
        hooked.arm(auction, abi.encodeCall(FishAuction.bid, (id, 50e18)));
        vm.prank(ada);
        vm.expectRevert(ReentrancyGuardTransient.ReentrancyGuardReentrantCall.selector);
        auction.withdraw();
    }
}
