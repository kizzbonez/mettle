contract BuoyPredictionTest is Test {
    BuoyDeployer factory;

    function setUp() public {
        factory = new BuoyDeployer();
    }

    function testFuzz_predict_is_the_create2_address(bytes32 salt) public view {
        address expected = vm.computeCreate2Address(salt, keccak256(type(BuoyRegistry).creationCode), address(factory));
        assertEq(factory.predict(salt), expected, "predict compared with the CREATE2 formula");
    }

    function test_the_same_address_on_every_network() public {
        bytes32 salt = keccak256("buoy-registry-v1");
        vm.chainId(1);
        address onMainnet = factory.predict(salt);
        vm.chainId(10);
        address onOptimism = factory.predict(salt);
        vm.chainId(42161);
        address onArbitrum = factory.predict(salt);
        assertEq(onOptimism, onMainnet, "OP Mainnet's predicted address compared with mainnet's");
        assertEq(onArbitrum, onMainnet, "Arbitrum One's predicted address compared with mainnet's");
    }

    function test_different_salts_give_different_addresses() public view {
        assertTrue(factory.predict(keccak256("a")) != factory.predict(keccak256("b")), "two salts give two addresses");
    }

    function test_deploy_lands_on_the_prediction() public {
        vm.chainId(1);
        bytes32 salt = bytes32(uint256(7));
        address predicted = factory.predict(salt);
        BuoyRegistry registry = factory.deploy(salt);
        assertEq(address(registry), predicted, "the deployed address compared with the prediction");
        assertGt(predicted.code.length, 0, "code at the predicted address after deploying");
        assertEq(registry.deployer(), address(factory), "the registry's deployer");
    }
}
