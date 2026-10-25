import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// Exposes the library to the test: BpsMath's functions are internal.
contract BpsProbe {
    function applyTo(Bps share, uint256 amount) external pure returns (uint256) {
        return share.applyTo(amount);
    }
}

contract CreditAndFeesTest is Test {
    event FeeChanged(Bps oldFee, Bps newFee);

    address master = makeAddr("harbour master");
    address stranger = makeAddr("stranger");
    HarbourCredit credit;

    function setUp() public {
        credit = new HarbourCredit(master);
    }

    function test_the_credit_token() public {
        assertEq(credit.name(), "Harbour Credit", "the token's name");
        assertEq(credit.symbol(), "HBC", "the token's symbol");
        assertEq(credit.decimals(), 18, "the token's decimals");
        assertEq(credit.owner(), master, "the token's owner");
        vm.prank(master);
        credit.mint(stranger, 5e18);
        assertEq(credit.balanceOf(stranger), 5e18, "a balance after minting");
        assertEq(credit.totalSupply(), 5e18, "the supply after minting");
    }

    function test_only_the_harbour_master_mints() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        credit.mint(stranger, 1);
    }

    function testFuzz_a_share_of_an_amount(uint16 bps, uint256 amount) public {
        bps = uint16(bound(bps, 0, 10_000));
        amount = bound(amount, 0, 1e30);
        BpsProbe probe = new BpsProbe();
        assertEq(probe.applyTo(Bps.wrap(bps), amount), amount * bps / 10_000, "a share in basis points");
    }

    function test_shares_round_down() public {
        BpsProbe probe = new BpsProbe();
        assertEq(probe.applyTo(Bps.wrap(250), 120e18), 3e18, "2.5% of 120 HBC");
        assertEq(probe.applyTo(Bps.wrap(1), 9_999), 0, "0.01% of 9999 wei");
        assertEq(probe.applyTo(Bps.wrap(10_000), 7), 7, "100% of 7 wei");
    }

    function test_the_constructor_refuses_a_fee_above_the_maximum() public {
        vm.expectRevert(abi.encodeWithSelector(FishAuction.FeeTooHigh.selector, Bps.wrap(1_001)));
        new FishAuction(credit, master, Bps.wrap(1_001));
    }

    function test_the_harbour_master_sets_the_fee() public {
        FishAuction auction = new FishAuction(credit, master, Bps.wrap(250));
        assertEq(Bps.unwrap(auction.fee()), 250, "the fee from the constructor");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        auction.setFee(Bps.wrap(100));

        vm.expectEmit(address(auction));
        emit FeeChanged(Bps.wrap(250), Bps.wrap(1_000));
        vm.prank(master);
        auction.setFee(Bps.wrap(1_000));
        assertEq(Bps.unwrap(auction.fee()), 1_000, "the fee after setFee");

        vm.prank(master);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.FeeTooHigh.selector, Bps.wrap(1_001)));
        auction.setFee(Bps.wrap(1_001));
    }

    function test_the_fee_is_fixed_when_the_catch_is_listed() public {
        FishAuction auction = new FishAuction(credit, master, Bps.wrap(250));
        address skipper = makeAddr("skipper");
        address buyer = makeAddr("buyer");
        vm.prank(master);
        credit.mint(buyer, 1_000e18);
        vm.prank(buyer);
        credit.approve(address(auction), type(uint256).max);

        vm.prank(skipper);
        uint256 id = auction.list(10e18, 1 hours);
        assertEq(Bps.unwrap(auction.auctionOf(id).fee), 250, "the fee recorded with the auction");
        vm.prank(buyer);
        auction.bid(id, 200e18);
        vm.prank(master);
        auction.setFee(Bps.wrap(1_000));

        vm.warp(block.timestamp + 1 hours);
        auction.settle(id);
        assertEq(auction.withdrawable(master), 5e18, "the fee charged after the fee was raised");
        assertEq(auction.withdrawable(skipper), 195e18, "the skipper's proceeds after the fee was raised");
    }

    function test_the_fee_goes_to_the_current_harbour_master() public {
        FishAuction auction = new FishAuction(credit, master, Bps.wrap(500));
        address nextMaster = makeAddr("next harbour master");
        address buyer = makeAddr("buyer");
        vm.prank(master);
        credit.mint(buyer, 100e18);
        vm.prank(buyer);
        credit.approve(address(auction), type(uint256).max);
        uint256 id = auction.list(1e18, 1 hours);
        vm.prank(buyer);
        auction.bid(id, 40e18);

        vm.prank(master);
        auction.transferOwnership(nextMaster);
        assertEq(auction.owner(), master, "the owner before the handover is accepted");
        vm.prank(nextMaster);
        auction.acceptOwnership();

        vm.warp(block.timestamp + 1 hours);
        auction.settle(id);
        assertEq(auction.withdrawable(nextMaster), 2e18, "the fee credited to the new harbour master");
        assertEq(auction.withdrawable(master), 0, "the fee credited to the old harbour master");
    }
}
