import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract SignatureReplayTest is Test {
    uint256 constant N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    uint256 treasurerKey = uint256(keccak256("replay treasurer"));
    address treasurer = vm.addr(treasurerKey);
    address bob = makeAddr("bob");
    SavingsPool pool;
    BonusDesk desk;

    function setUp() public {
        pool = new SavingsPool(treasurer);
        desk = fundedDesk();
    }

    function fundedDesk() internal returns (BonusDesk d) {
        d = new BonusDesk(pool, treasurer);
        vm.deal(address(this), 10 ether);
        (bool ok,) = address(d).call{value: 10 ether}("");
        require(ok, "funding the desk");
    }

    function sign(BonusDesk d, uint256 amount, uint256 nonce, uint256 deadline)
        internal
        view
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        return vm.sign(treasurerKey, d.bonusDigest(bob, amount, nonce, deadline));
    }

    function tryClaim(BonusDesk d, uint256 nonce, bytes memory signature) internal {
        vm.prank(makeAddr("anyone"));
        try d.claim(bob, 1 ether, nonce, 1 days, signature) {} catch {}
    }

    function test_one_voucher_submitted_ten_times() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(desk, 1 ether, 0, 1 days);
        for (uint256 i = 0; i < 10; i++) {
            tryClaim(desk, 0, abi.encodePacked(r, s, v));
        }
        assertEq(pool.assetsOf(bob), 1 ether, "bob's bonus after one voucher was submitted ten times");
        assertEq(address(desk).balance, 9 ether, "the ether left in the desk after the replays");
    }

    function test_the_malleable_twin_of_a_used_voucher() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(desk, 1 ether, 0, 1 days);
        tryClaim(desk, 0, abi.encodePacked(r, s, v));
        tryClaim(desk, 0, abi.encodePacked(r, bytes32(N - uint256(s)), v == 27 ? uint8(28) : uint8(27)));
        assertEq(pool.assetsOf(bob), 1 ether, "bob's bonus after the voucher's malleable twin was submitted");
    }

    function test_a_voucher_for_another_desk() public {
        BonusDesk other = fundedDesk();
        (uint8 v, bytes32 r, bytes32 s) = sign(other, 1 ether, 0, 1 days);
        tryClaim(desk, 0, abi.encodePacked(r, s, v));
        assertEq(pool.assetsOf(bob), 0, "bob's bonus from a voucher signed for another desk");
    }

    function test_a_voucher_from_another_chain() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(desk, 1 ether, 0, 1 days);
        vm.chainId(10);
        tryClaim(desk, 0, abi.encodePacked(r, s, v));
        assertEq(pool.assetsOf(bob), 0, "bob's bonus from a voucher signed on another chain");
    }

    function test_an_expired_voucher() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(desk, 1 ether, 0, 1 days);
        bytes memory late = abi.encodePacked(r, s, v);
        vm.warp(1 days + 1);
        vm.expectRevert(abi.encodeWithSelector(BonusDesk.Expired.selector, 1 days));
        desk.claim(bob, 1 ether, 0, 1 days, late);
    }

    function test_vouchers_are_used_in_order() public {
        (uint8 v, bytes32 r, bytes32 s) = sign(desk, 1 ether, 1, 1 days);
        bytes memory second = abi.encodePacked(r, s, v);
        vm.expectRevert(abi.encodeWithSelector(Nonces.InvalidAccountNonce.selector, bob, 0));
        desk.claim(bob, 1 ether, 1, 1 days, second);
    }

    function test_the_digest_is_eip712_typed_data() public view {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("BonusDesk"),
                keccak256("1"),
                block.chainid,
                address(desk)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Bonus(address member,uint256 amount,uint256 nonce,uint256 deadline)"),
                bob,
                2 ether,
                4,
                3 days
            )
        );
        assertEq(
            desk.bonusDigest(bob, 2 ether, 4, 3 days),
            keccak256(abi.encodePacked("\x19\x01", domain, structHash)),
            "the bonus voucher digest"
        );
    }
}
