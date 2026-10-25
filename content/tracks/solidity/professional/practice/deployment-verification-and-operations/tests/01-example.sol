contract BuoyExampleTest is Test {
    event RegistryDeployed(uint256 indexed chainId, address registry, address owner);

    function test_example() public {
        BuoyDeployer factory = new BuoyDeployer();
        bytes32 salt = keccak256("buoy-registry-v1");

        vm.chainId(10); // pretend to be OP Mainnet
        address predicted = factory.predict(salt);
        assertEq(factory.multisigFor(10), 0x2222222222222222222222222222222222222222, "OP Mainnet's multisig");

        vm.expectEmit(address(factory));
        emit RegistryDeployed(10, predicted, 0x2222222222222222222222222222222222222222);
        BuoyRegistry registry = factory.deploy(salt);

        assertEq(address(registry), predicted, "the registry's address compared with the prediction");
        assertEq(registry.owner(), 0x2222222222222222222222222222222222222222, "the registry's owner on OP Mainnet");

        vm.expectRevert(abi.encodeWithSelector(BuoyDeployer.AlreadyDeployed.selector, predicted));
        factory.deploy(salt);
    }
}
