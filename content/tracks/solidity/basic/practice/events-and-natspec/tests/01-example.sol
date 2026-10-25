contract ExampleTest is Test {
    event Planted(uint256 indexed saplingId, uint256 indexed plot, address indexed planter, string species);
    event Measured(uint256 indexed saplingId, uint256 previousCm, uint256 newCm);

    function test_example() public {
        SaplingRegister register = new SaplingRegister();
        address ada = address(0xA11CE);

        vm.expectEmit(address(register));
        emit Planted(1, 4, ada, "rowan");
        vm.prank(ada);
        register.plant(4, "rowan");

        vm.expectEmit(address(register));
        emit Measured(1, 0, 30);
        vm.prank(ada);
        register.recordHeight(1, 30);

        vm.expectEmit(address(register));
        emit Measured(1, 30, 42);
        vm.prank(ada);
        register.recordHeight(1, 42);

        vm.expectRevert(abi.encodeWithSelector(SaplingRegister.NotPlanter.selector, 1, address(this)));
        register.recordHeight(1, 50);

        vm.expectRevert(abi.encodeWithSelector(SaplingRegister.UnknownSapling.selector, 9));
        register.recordHeight(9, 50);
    }
}
