contract ExampleTest is Test {
    event Saved(address indexed member, uint256 amount);
    event Withdrawn(address indexed member, uint256 amount);

    function test_example() public {
        SavingsJar jar = new SavingsJar();
        address ada = address(0xA11CE);
        vm.deal(ada, 2 ether);

        vm.expectEmit(address(jar));
        emit Saved(ada, 0.5 ether);
        vm.prank(ada);
        jar.save{value: 0.5 ether}();

        vm.expectEmit(address(jar));
        emit Saved(ada, 0.25 ether);
        vm.prank(ada);
        (bool ok,) = address(jar).call{value: 0.25 ether}("");
        assertTrue(ok, "a plain transfer to the jar succeeds");

        assertEq(jar.savedBy(ada), 0.75 ether, "Ada's savings after two deposits");
        assertEq(jar.totalSaved(), 0.75 ether, "total savings after two deposits");

        vm.expectEmit(address(jar));
        emit Withdrawn(ada, 0.5 ether);
        vm.prank(ada);
        jar.withdraw(0.5 ether);
        assertEq(ada.balance, 1.75 ether, "Ada's balance after withdrawing");
        assertEq(address(jar).balance, 0.25 ether, "ether left in the jar");

        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(SavingsJar.InsufficientSavings.selector, 0.25 ether, 1 ether));
        jar.withdraw(1 ether);
    }
}
