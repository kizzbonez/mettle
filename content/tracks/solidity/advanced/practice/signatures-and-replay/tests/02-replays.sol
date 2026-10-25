contract ReplayTest is Test {
    uint256 constant N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    uint256 coordinatorKey = uint256(keccak256("replay coordinator"));
    address coordinator = vm.addr(coordinatorKey);
    address picker = makeAddr("picker");
    address attacker = makeAddr("attacker");
    HarvestPay pay;

    function setUp() public {
        vm.deal(address(this), 20 ether);
        pay = new HarvestPay{value: 10 ether}(coordinator);
    }

    function sign(bytes32 digest) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        return vm.sign(coordinatorKey, digest);
    }

    function attempt(HarvestPay target, uint256 nonce, bytes memory signature) internal {
        vm.prank(attacker);
        try target.redeem(picker, 1 ether, nonce, 1 days, signature) {} catch {}
    }

    function test_one_voucher_redeemed_eleven_times() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(pay.voucherDigest(picker, 1 ether, 0, 1 days));
        bytes memory voucher = abi.encodePacked(r, s, v);
        for (uint256 i = 0; i < 11; i++) {
            attempt(pay, 0, voucher);
        }
        assertEq(picker.balance, 1 ether, "the pay from one voucher submitted eleven times");
        assertEq(address(pay).balance, 9 ether, "the contract's balance after the replays");
    }

    function test_the_malleable_twin_of_a_used_voucher() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(pay.voucherDigest(picker, 1 ether, 0, 1 days));
        pay.redeem(picker, 1 ether, 0, 1 days, abi.encodePacked(r, s, v));
        bytes memory twin = abi.encodePacked(r, bytes32(N - uint256(s)), v == 27 ? uint8(28) : uint8(27));
        attempt(pay, 0, twin);
        assertEq(picker.balance, 1 ether, "the pay after the voucher's malleable twin was submitted");
    }

    function test_a_voucher_for_another_contract() public {
        HarvestPay other = new HarvestPay{value: 10 ether}(coordinator);
        (uint8 v, bytes32 r, bytes32 s) = sign(other.voucherDigest(picker, 1 ether, 0, 1 days));
        attempt(pay, 0, abi.encodePacked(r, s, v));
        assertEq(picker.balance, 0, "the pay from a voucher signed for another HarvestPay contract");
    }

    function test_a_voucher_from_another_chain() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(pay.voucherDigest(picker, 1 ether, 0, 1 days));
        vm.chainId(10);
        attempt(pay, 0, abi.encodePacked(r, s, v));
        assertEq(picker.balance, 0, "the pay from a voucher signed on another chain");
    }
}
