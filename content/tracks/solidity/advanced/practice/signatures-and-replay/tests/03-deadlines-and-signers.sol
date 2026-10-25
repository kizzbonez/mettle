contract DeadlinesAndSignersTest is Test {
    uint256 coordinatorKey = uint256(keccak256("deadline coordinator"));
    address coordinator = vm.addr(coordinatorKey);
    address picker = makeAddr("picker");
    HarvestPay pay;

    function setUp() public {
        vm.deal(address(this), 10 ether);
        pay = new HarvestPay{value: 10 ether}(coordinator);
    }

    function voucher(uint256 key, uint256 nonce, uint256 deadline) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, pay.voucherDigest(picker, 1 ether, nonce, deadline));
        return abi.encodePacked(r, s, v);
    }

    function test_accepts_a_voucher_on_its_deadline() public {
        vm.warp(5 days);
        pay.redeem(picker, 1 ether, 0, 5 days, voucher(coordinatorKey, 0, 5 days));
        assertEq(picker.balance, 1 ether, "the pay from a voucher redeemed at its deadline");
    }

    function test_rejects_a_voucher_after_its_deadline() public {
        bytes memory late = voucher(coordinatorKey, 0, 5 days);
        vm.warp(5 days + 1);
        vm.expectRevert(abi.encodeWithSelector(HarvestPay.Expired.selector, 5 days));
        pay.redeem(picker, 1 ether, 0, 5 days, late);
    }

    function test_rejects_a_voucher_signed_by_someone_else() public {
        uint256 strangerKey = uint256(keccak256("stranger"));
        bytes memory forged = voucher(strangerKey, 0, 1 days);
        vm.expectRevert(abi.encodeWithSelector(HarvestPay.WrongSigner.selector, vm.addr(strangerKey)));
        pay.redeem(picker, 1 ether, 0, 1 days, forged);
    }

    function test_garbage_signatures_pay_nothing_after_retirement() public {
        vm.prank(coordinator);
        pay.retire();
        bytes[3] memory garbage = [
            new bytes(65),
            abi.encodePacked(bytes32(0), bytes32(0), uint8(27)),
            abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(1)), uint8(29))
        ];
        for (uint256 i = 0; i < garbage.length; i++) {
            try pay.redeem(picker, 1 ether, 0, 1 days, garbage[i]) {} catch {}
        }
        assertEq(picker.balance, 0, "the pay from garbage signatures once the coordinator is zero");
    }

    function test_real_vouchers_pay_nothing_after_retirement() public {
        bytes memory signed = voucher(coordinatorKey, 0, 1 days);
        vm.prank(coordinator);
        pay.retire();
        try pay.redeem(picker, 1 ether, 0, 1 days, signed) {} catch {}
        assertEq(picker.balance, 0, "the pay from a real voucher after retire()");
    }

    function test_only_the_coordinator_retires() public {
        vm.prank(picker);
        vm.expectRevert(abi.encodeWithSelector(HarvestPay.NotCoordinator.selector, picker));
        pay.retire();
    }
}
