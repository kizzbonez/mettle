contract ReceiveAndEntryPointTest is Test {
    address entryPoint = makeAddr("entryPoint");
    address ines;
    uint256 inesKey;

    function setUp() public {
        (ines, inesKey) = makeAddrAndKey("ines");
        StudioDelegate impl = new StudioDelegate(entryPoint);
        vm.signAndAttachDelegation(address(impl), inesKey);
        StudioDelegate(payable(ines)).entryPoint(); // the call that carries the authorization
    }

    function test_a_delegated_eoa_accepts_payments() public {
        address customer = makeAddr("customer");
        vm.deal(customer, 1 ether);
        vm.prank(customer);
        (bool ok,) = ines.call{value: 0.4 ether}("");
        assertTrue(ok, "a plain ether payment to the delegated EOA succeeds");
        assertEq(ines.balance, 0.4 ether, "Ines's balance after a customer paid her");
    }

    function test_the_entry_point_is_seen_through_the_eoa() public view {
        assertEq(StudioDelegate(payable(ines)).entryPoint(), entryPoint, "entryPoint read through the delegated EOA");
    }

    function test_the_entry_point_executes_a_validated_operation() public {
        vm.deal(ines, 1 ether);
        address fixer = makeAddr("fixer");
        StudioDelegate.Call[] memory calls = new StudioDelegate.Call[](1);
        calls[0] = StudioDelegate.Call(fixer, 0.3 ether, "");
        vm.prank(entryPoint);
        StudioDelegate(payable(ines)).execute(calls);
        assertEq(fixer.balance, 0.3 ether, "a payment the EntryPoint executed for Ines");
    }
}
