contract ValidateTest is Test {
    address entryPoint = makeAddr("entryPoint");
    address ines;
    uint256 inesKey;
    bytes32 constant HASH = keccak256("user operation 42");

    function setUp() public {
        (ines, inesKey) = makeAddrAndKey("ines");
        vm.deal(ines, 1 ether);
        StudioDelegate impl = new StudioDelegate(entryPoint);
        vm.signAndAttachDelegation(address(impl), inesKey);
        StudioDelegate(payable(ines)).entryPoint(); // the call that carries the authorization
    }

    function _op(uint256 key, bytes32 hash) internal view returns (PackedUserOperation memory op) {
        op.sender = ines;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, hash);
        op.signature = abi.encodePacked(r, s, v);
    }

    function test_accepts_the_accounts_own_signature() public {
        PackedUserOperation memory op = _op(inesKey, HASH);
        vm.prank(entryPoint);
        uint256 result = StudioDelegate(payable(ines)).validateUserOp(op, HASH, 0);
        assertEq(result, 0, "validation of Ines's signature");
    }

    function test_returns_one_for_another_signer() public {
        (, uint256 malloryKey) = makeAddrAndKey("mallory");
        PackedUserOperation memory op = _op(malloryKey, HASH);
        vm.prank(entryPoint);
        uint256 result = StudioDelegate(payable(ines)).validateUserOp(op, HASH, 0);
        assertEq(result, 1, "validation of a signature by someone else");
    }

    function test_returns_one_for_a_signature_of_another_hash() public {
        PackedUserOperation memory op = _op(inesKey, keccak256("another operation"));
        vm.prank(entryPoint);
        uint256 result = StudioDelegate(payable(ines)).validateUserOp(op, HASH, 0);
        assertEq(result, 1, "validation of Ines's signature of a different operation");
    }

    function test_returns_one_for_a_malformed_signature() public {
        PackedUserOperation memory op;
        op.sender = ines;
        op.signature = hex"c0ffee";
        vm.prank(entryPoint);
        uint256 result = StudioDelegate(payable(ines)).validateUserOp(op, HASH, 0);
        assertEq(result, 1, "validation of a three-byte signature");
    }

    function test_only_the_entry_point_validates() public {
        address stranger = makeAddr("stranger");
        PackedUserOperation memory op = _op(inesKey, HASH);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(StudioDelegate.Unauthorized.selector, stranger));
        StudioDelegate(payable(ines)).validateUserOp(op, HASH, 0.1 ether);
        assertEq(stranger.balance, 0, "ether a stranger got by calling validateUserOp");
    }

    function test_pays_the_missing_funds_to_the_entry_point() public {
        PackedUserOperation memory op = _op(inesKey, HASH);
        vm.prank(entryPoint);
        StudioDelegate(payable(ines)).validateUserOp(op, HASH, 0.1 ether);
        assertEq(entryPoint.balance, 0.1 ether, "the prefund the EntryPoint received");
        assertEq(ines.balance, 0.9 ether, "Ines's balance after paying the prefund");
    }

    function test_reverts_when_the_prefund_cannot_be_paid() public {
        // This test contract acts as the EntryPoint and has no receive function: it refuses ether.
        (address olga, uint256 olgaKey) = makeAddrAndKey("olga");
        vm.deal(olga, 1 ether);
        StudioDelegate impl = new StudioDelegate(address(this));
        vm.signAndAttachDelegation(address(impl), olgaKey);
        StudioDelegate(payable(olga)).entryPoint();
        PackedUserOperation memory op;
        op.sender = olga;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(olgaKey, HASH);
        op.signature = abi.encodePacked(r, s, v);
        vm.expectRevert(StudioDelegate.PrefundFailed.selector);
        StudioDelegate(payable(olga)).validateUserOp(op, HASH, 0.1 ether);
    }
}
