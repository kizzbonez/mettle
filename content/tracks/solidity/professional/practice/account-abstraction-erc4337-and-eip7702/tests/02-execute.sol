contract ExecuteRulesTest is Test {
    address entryPoint = makeAddr("entryPoint");
    address ines;
    uint256 inesKey;

    function setUp() public {
        (ines, inesKey) = makeAddrAndKey("ines");
        vm.deal(ines, 3 ether);
        StudioDelegate impl = new StudioDelegate(entryPoint);
        vm.signAndAttachDelegation(address(impl), inesKey);
        StudioDelegate(payable(ines)).entryPoint(); // the call that carries the authorization
    }

    function _pay(address to, uint256 amount) internal pure returns (StudioDelegate.Call[] memory calls) {
        calls = new StudioDelegate.Call[](1);
        calls[0] = StudioDelegate.Call(to, amount, "");
    }

    function testFuzz_strangers_cannot_execute(address stranger) public {
        vm.assume(stranger != ines && stranger != entryPoint);
        address thief = makeAddr("thief");
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(StudioDelegate.Unauthorized.selector, stranger));
        StudioDelegate(payable(ines)).execute(_pay(thief, 1 ether));
        assertEq(ines.balance, 3 ether, "Ines's balance after a stranger's attempt");
    }

    function test_the_account_itself_executes() public {
        address supplier = makeAddr("supplier");
        vm.prank(ines);
        StudioDelegate(payable(ines)).execute(_pay(supplier, 1 ether));
        assertEq(supplier.balance, 1 ether, "a payment made by the account itself");
    }

    function test_a_failing_call_reverts_the_whole_batch() public {
        address supplier = makeAddr("supplier");
        StudioDelegate.Call[] memory calls = new StudioDelegate.Call[](3);
        calls[0] = StudioDelegate.Call(supplier, 1 ether, "");
        calls[1] = StudioDelegate.Call(supplier, 0.5 ether, "");
        calls[2] = StudioDelegate.Call(supplier, 5 ether, ""); // more than Ines has left
        vm.prank(ines);
        vm.expectRevert(abi.encodeWithSelector(StudioDelegate.CallFailed.selector, 2));
        StudioDelegate(payable(ines)).execute(calls);
        assertEq(supplier.balance, 0, "payments from a batch that failed");
        assertEq(ines.balance, 3 ether, "Ines's balance after a batch that failed");
    }

    function test_calls_carry_their_data() public {
        StudioLedgerProbe probe = new StudioLedgerProbe();
        StudioDelegate.Call[] memory calls = new StudioDelegate.Call[](2);
        calls[0] = StudioDelegate.Call(address(probe), 0, abi.encodeCall(StudioLedgerProbe.note, (7)));
        calls[1] = StudioDelegate.Call(address(probe), 0.1 ether, abi.encodeCall(StudioLedgerProbe.note, (9)));
        vm.prank(ines);
        StudioDelegate(payable(ines)).execute(calls);
        assertEq(probe.total(), 16, "the sum of the numbers passed in the calls' data");
        assertEq(probe.lastCaller(), ines, "the caller the target saw");
        assertEq(address(probe).balance, 0.1 ether, "ether sent with a call that has data");
    }
}

contract StudioLedgerProbe {
    uint256 public total;
    address public lastCaller;

    function note(uint256 x) external payable {
        total += x;
        lastCaller = msg.sender;
    }
}
