import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract RefusesPay {
    receive() external payable {
        revert("no thanks");
    }
}

contract TypedDataAndNoncesTest is Test {
    uint256 coordinatorKey = uint256(keccak256("typed coordinator"));
    address coordinator = vm.addr(coordinatorKey);
    HarvestPay pay;

    function setUp() public {
        vm.deal(address(this), 120 ether);
        pay = new HarvestPay{value: 120 ether}(coordinator);
    }

    function voucher(address picker, uint256 amount, uint256 nonce) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(coordinatorKey, pay.voucherDigest(picker, amount, nonce, 1 days));
        return abi.encodePacked(r, s, v);
    }

    function test_the_digest_is_eip712_typed_data() public view {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("HarvestPay"),
                keccak256("1"),
                block.chainid,
                address(pay)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Voucher(address picker,uint256 amount,uint256 nonce,uint256 deadline)"),
                address(0xA11CE),
                2 ether,
                7,
                3 days
            )
        );
        bytes32 expected = keccak256(abi.encodePacked("\x19\x01", domain, structHash));
        assertEq(pay.voucherDigest(address(0xA11CE), 2 ether, 7, 3 days), expected, "the voucher digest");
    }

    function test_nonces_are_used_in_order() public {
        address picker = makeAddr("picker");
        bytes memory second = voucher(picker, 1 ether, 1);
        vm.expectRevert(abi.encodeWithSelector(Nonces.InvalidAccountNonce.selector, picker, 0));
        pay.redeem(picker, 1 ether, 1, 1 days, second);
        pay.redeem(picker, 1 ether, 0, 1 days, voucher(picker, 1 ether, 0));
        pay.redeem(picker, 1 ether, 1, 1 days, second);
        assertEq(picker.balance, 2 ether, "the pay after vouchers 0 and 1");
    }

    function testFuzz_each_picker_has_own_nonces(uint64 a, uint64 b) public {
        address ann = makeAddr("ann");
        address ben = makeAddr("ben");
        for (uint256 nonce = 0; nonce < 3; nonce++) {
            pay.redeem(ann, a, nonce, 1 days, voucher(ann, a, nonce));
            pay.redeem(ben, b, nonce, 1 days, voucher(ben, b, nonce));
        }
        assertEq(ann.balance, uint256(a) * 3, "the first picker's pay after three vouchers");
        assertEq(ben.balance, uint256(b) * 3, "the second picker's pay after three vouchers");
    }

    function test_a_refused_payment_reverts() public {
        address picker = address(new RefusesPay());
        bytes memory signed = voucher(picker, 1 ether, 0);
        vm.expectRevert(HarvestPay.PaymentFailed.selector);
        pay.redeem(picker, 1 ether, 0, 1 days, signed);
        assertEq(address(pay).balance, 120 ether, "the contract's balance after a refused payment");
    }
}
