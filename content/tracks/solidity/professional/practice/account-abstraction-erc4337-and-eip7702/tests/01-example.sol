contract ExampleTest is Test {
    function test_example() public {
        address entryPoint = makeAddr("entryPoint");
        (address ines, uint256 inesKey) = makeAddrAndKey("ines");
        address supplier = makeAddr("supplier");
        address fixer = makeAddr("fixer");
        address mallory = makeAddr("mallory");
        vm.deal(ines, 2 ether);

        StudioDelegate impl = new StudioDelegate(entryPoint);
        vm.signAndAttachDelegation(address(impl), inesKey);

        StudioDelegate.Call[] memory calls = new StudioDelegate.Call[](2);
        calls[0] = StudioDelegate.Call(supplier, 0.5 ether, "");
        calls[1] = StudioDelegate.Call(fixer, 0.25 ether, "");
        vm.prank(ines);
        StudioDelegate(payable(ines)).execute(calls);
        assertEq(supplier.balance, 0.5 ether, "the sand supplier's payment");
        assertEq(fixer.balance, 0.25 ether, "the kiln fixer's payment");
        assertEq(ines.balance, 1.25 ether, "Ines's balance after the batch");

        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(StudioDelegate.Unauthorized.selector, mallory));
        StudioDelegate(payable(ines)).execute(calls);

        PackedUserOperation memory op;
        op.sender = ines;
        bytes32 hash = keccak256("user operation 1");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(inesKey, hash);
        op.signature = abi.encodePacked(r, s, v);
        vm.prank(entryPoint);
        uint256 result = StudioDelegate(payable(ines)).validateUserOp(op, hash, 0);
        assertEq(result, 0, "validation of a user operation Ines signed");
    }
}
