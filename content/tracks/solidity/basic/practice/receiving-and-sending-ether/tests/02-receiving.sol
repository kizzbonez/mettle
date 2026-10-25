contract ReceivingTest is Test {
    event Saved(address indexed member, uint256 amount);

    SavingsJar jar;
    address bo = address(0xB0);
    address cy = address(0xC1);

    function setUp() public {
        jar = new SavingsJar();
        vm.deal(bo, 10 ether);
        vm.deal(cy, 10 ether);
    }

    function test_plain_transfer_counts_as_saving() public {
        vm.expectEmit(address(jar));
        emit Saved(bo, 1 ether);
        vm.prank(bo);
        (bool ok,) = address(jar).call{value: 1 ether}("");
        assertTrue(ok, "a plain transfer to the jar succeeds");
        assertEq(jar.savedBy(bo), 1 ether, "savings recorded for a plain transfer");
        assertEq(jar.totalSaved(), 1 ether, "total after a plain transfer");
    }

    function test_nothing_saved_is_refused() public {
        vm.prank(bo);
        vm.expectRevert(SavingsJar.ZeroAmount.selector);
        jar.save();

        vm.prank(bo);
        (bool ok, bytes memory reason) = address(jar).call("");
        assertFalse(ok, "a plain transfer of zero ether is refused");
        assertEq(reason, abi.encodeWithSelector(SavingsJar.ZeroAmount.selector), "the error for a zero transfer");
    }

    function test_unknown_calls_are_refused() public {
        vm.prank(bo);
        (bool ok, bytes memory reason) = address(jar).call{value: 1 ether}(hex"deadbeef");
        assertFalse(ok, "a call to a missing function with ether is refused");
        assertEq(reason, abi.encodeWithSelector(SavingsJar.UnknownCall.selector), "the error for a missing function");

        (ok, reason) = address(jar).call(hex"deadbeef");
        assertFalse(ok, "a call to a missing function without ether is refused");
        assertEq(reason, abi.encodeWithSelector(SavingsJar.UnknownCall.selector), "the error without ether");

        assertEq(address(jar).balance, 0, "ether kept after refused calls");
        assertEq(bo.balance, 10 ether, "the caller's ether after a refused call");
    }

    function testFuzz_records_match_the_ether_held(uint96 fromBo, uint96 fromCy) public {
        vm.assume(fromBo > 0 && fromCy > 0);
        vm.deal(bo, fromBo);
        vm.deal(cy, fromCy);

        vm.prank(bo);
        jar.save{value: fromBo}();
        vm.prank(cy);
        (bool ok,) = address(jar).call{value: fromCy}("");
        assertTrue(ok, "a plain transfer to the jar succeeds");

        assertEq(jar.savedBy(bo), fromBo, "savings of the first member");
        assertEq(jar.savedBy(cy), fromCy, "savings of the second member");
        assertEq(jar.totalSaved(), uint256(fromBo) + fromCy, "total savings");
        assertEq(address(jar).balance, jar.totalSaved(), "ether held equals total savings");
    }
}
