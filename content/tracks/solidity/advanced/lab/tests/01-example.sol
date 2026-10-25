import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract ExampleTest is Test {
    uint256 treasurerKey = uint256(keccak256("credit union treasurer")); // a test key, made here
    address treasurer = vm.addr(treasurerKey);
    address alice = makeAddr("alice");
    address stranger = makeAddr("stranger");
    SavingsPool pool;
    BonusDesk desk;

    function setUp() public {
        pool = new SavingsPool(treasurer);
        desk = new BonusDesk(pool, treasurer);
        vm.deal(address(this), 5 ether);
        (bool ok,) = address(desk).call{value: 5 ether}(""); // the board funds the bonus desk
        require(ok, "funding the desk");
        vm.deal(alice, 10 ether);
        vm.deal(treasurer, 10 ether);
    }

    function sign(bytes32 digest) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(treasurerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_example() public {
        vm.prank(alice);
        pool.deposit{value: 3 ether}();
        vm.prank(treasurer);
        pool.addInterest{value: 1.5 ether}();
        assertEq(pool.assetsOf(alice), 4.5 ether, "alice's savings after the interest");

        vm.prank(alice);
        uint256 burned = pool.withdraw(1.5 ether);
        assertEq(burned, 1 ether, "the shares burned for a 1.5 ether withdrawal");
        assertEq(alice.balance, 8.5 ether, "alice's ether after the withdrawal");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(SavingsPool.InsufficientShares.selector, 0, 1));
        pool.withdraw(1);

        bytes memory voucher = sign(desk.bonusDigest(alice, 0.3 ether, 0, 1 days));
        desk.claim(alice, 0.3 ether, 0, 1 days, voucher);
        assertEq(pool.assetsOf(alice), 3.3 ether, "alice's savings after a 0.3 ether bonus");
        vm.expectRevert(abi.encodeWithSelector(Nonces.InvalidAccountNonce.selector, alice, 1));
        desk.claim(alice, 0.3 ether, 0, 1 days, voucher);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Roles.NotOwner.selector, alice));
        desk.setTreasurer(alice);
    }
}
