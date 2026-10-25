import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract ExampleTest is Test {
    event Paid(address indexed picker, uint256 amount, uint256 nonce);

    uint256 coordinatorKey = uint256(keccak256("orchard coordinator")); // a test key, made here
    address coordinator = vm.addr(coordinatorKey);
    address picker = makeAddr("picker");
    HarvestPay pay;

    function setUp() public {
        vm.deal(address(this), 10 ether);
        pay = new HarvestPay{value: 10 ether}(coordinator);
    }

    function sign(uint256 key, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_example() public {
        bytes memory voucher = sign(coordinatorKey, pay.voucherDigest(picker, 0.3 ether, 0, 1 days));
        vm.expectEmit(address(pay));
        emit Paid(picker, 0.3 ether, 0);
        pay.redeem(picker, 0.3 ether, 0, 1 days, voucher);
        assertEq(picker.balance, 0.3 ether, "the picker's pay after one voucher");

        vm.expectRevert(abi.encodeWithSelector(Nonces.InvalidAccountNonce.selector, picker, 1));
        pay.redeem(picker, 0.3 ether, 0, 1 days, voucher);

        bytes memory next = sign(coordinatorKey, pay.voucherDigest(picker, 0.2 ether, 1, 1 days));
        pay.redeem(picker, 0.2 ether, 1, 1 days, next);
        assertEq(picker.balance, 0.5 ether, "the picker's pay after the next voucher");
    }
}
