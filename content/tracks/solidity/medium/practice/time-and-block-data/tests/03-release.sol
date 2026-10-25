/// An apprentice whose wallet refuses ether.
contract ClosedWallet {
    function collect(ApprenticeBonus bonus) external {
        bonus.release();
    }
}

/// An apprentice that tries to release again while being paid.
contract EagerWallet {
    ApprenticeBonus public bonus;
    uint256 public received;

    function setBonus(ApprenticeBonus b) external {
        bonus = b;
    }

    function collect() external {
        bonus.release();
    }

    receive() external payable {
        received += msg.value;
        try bonus.release() {} catch {}
    }
}

contract BonusReleaseTest is Test {
    event Released(address indexed to, uint256 amount);

    uint256 constant START = 1_767_225_600;
    address cal = address(0xCA1);
    ApprenticeBonus bonus;

    function setUp() public {
        vm.warp(START);
        vm.deal(address(this), 100 ether);
        bonus = new ApprenticeBonus{value: 10 ether}(cal, START, 10 days, 100 days);
    }

    function test_only_the_apprentice_releases() public {
        vm.warp(START + 50 days);
        vm.prank(address(0xBAD));
        vm.expectRevert(abi.encodeWithSelector(ApprenticeBonus.NotApprentice.selector, address(0xBAD)));
        bonus.release();
    }

    function test_nothing_before_the_cliff() public {
        vm.warp(START + 10 days - 1);
        assertEq(bonus.releasable(), 0, "releasable before the cliff");
        vm.prank(cal);
        vm.expectRevert(ApprenticeBonus.NothingToRelease.selector);
        bonus.release();
    }

    function test_releases_add_up() public {
        vm.warp(START + 20 days);
        vm.expectEmit(address(bonus));
        emit Released(cal, 2 ether);
        vm.prank(cal);
        bonus.release();

        vm.warp(START + 35 days);
        assertEq(bonus.releasable(), 1.5 ether, "releasable fifteen days after the first release");
        vm.expectEmit(address(bonus));
        emit Released(cal, 1.5 ether);
        vm.prank(cal);
        bonus.release();

        assertEq(bonus.released(), 3.5 ether, "released after two releases");
        assertEq(cal.balance, 3.5 ether, "the apprentice's balance after two releases");
        assertEq(address(bonus).balance, 6.5 ether, "ether still locked after two releases");
    }

    function test_a_refused_payment_reverts_everything() public {
        ClosedWallet wallet = new ClosedWallet();
        ApprenticeBonus locked = new ApprenticeBonus{value: 1 ether}(address(wallet), START, 0, 10 days);
        vm.warp(START + 5 days);
        vm.expectRevert(ApprenticeBonus.PaymentFailed.selector);
        wallet.collect(locked);
        assertEq(locked.released(), 0, "released after a refused payment");
        assertEq(locked.lastRelease(), 0, "lastRelease after a refused payment");
    }

    function test_a_re_entering_apprentice_gets_only_what_vested() public {
        EagerWallet wallet = new EagerWallet();
        ApprenticeBonus eager = new ApprenticeBonus{value: 10 ether}(address(wallet), START, 0, 100 days);
        wallet.setBonus(eager);
        vm.warp(START + 30 days);
        wallet.collect();
        assertEq(wallet.received(), 3 ether, "ether received by a re-entering apprentice");
        assertEq(eager.released(), 3 ether, "released after a re-entry attempt");
        assertEq(address(eager).balance, 7 ether, "ether still locked after a re-entry attempt");
    }
}
