contract ExampleTest is Test {
    bytes32 constant IMPLEMENTATION = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);

    function test_example() public {
        address treasurer = makeAddr("treasurer");
        DuesVault logic = new DuesVault();
        DuesProxy proxy = new DuesProxy(address(logic), abi.encodeCall(DuesVault.initialize, (treasurer)));
        DuesVault vault = DuesVault(address(proxy)); // the proxy, called through the vault's interface

        assertEq(vault.treasurer(), treasurer, "the treasurer, read through the proxy");
        assertEq(proxy.implementation(), address(logic), "the proxy's implementation");
        assertEq(
            address(uint160(uint256(vm.load(address(proxy), IMPLEMENTATION)))),
            address(logic),
            "the address in the proxy's ERC-1967 implementation slot"
        );

        address member = makeAddr("member");
        vm.deal(member, 1 ether);
        vm.prank(member);
        vault.payDues{value: 0.25 ether}();
        assertEq(vault.paid(member), 0.25 ether, "the dues recorded for the member");
        assertEq(proxy.implementation(), address(logic), "the proxy's implementation after a member paid");

        vm.prank(treasurer);
        vault.withdraw(treasurer, 0.1 ether);
        assertEq(treasurer.balance, 0.1 ether, "the ether the treasurer withdrew");
        assertEq(vault.total(), 0.15 ether, "the dues left in the vault");
    }
}
