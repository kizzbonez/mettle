contract BuoyNetworksTest is Test {
    BuoyDeployer factory;

    function setUp() public {
        factory = new BuoyDeployer();
    }

    function test_each_network_has_its_multisig() public view {
        assertEq(factory.multisigFor(1), 0x1111111111111111111111111111111111111111, "Ethereum mainnet's multisig");
        assertEq(factory.multisigFor(10), 0x2222222222222222222222222222222222222222, "OP Mainnet's multisig");
        assertEq(factory.multisigFor(42161), 0x3333333333333333333333333333333333333333, "Arbitrum One's multisig");
    }

    function testFuzz_unknown_networks_are_refused(uint256 chainId) public {
        vm.assume(chainId != 1 && chainId != 10 && chainId != 42161);
        vm.expectRevert(abi.encodeWithSelector(BuoyDeployer.UnsupportedChain.selector, chainId));
        factory.multisigFor(chainId);
    }

    function test_deploying_on_an_unknown_network_is_refused() public {
        vm.chainId(8453);
        bytes32 salt = keccak256("buoy-registry-v1");
        vm.expectRevert(abi.encodeWithSelector(BuoyDeployer.UnsupportedChain.selector, 8453));
        factory.deploy(salt);
        assertEq(factory.predict(salt).code.length, 0, "code at the predicted address after a refused deployment");
    }

    function test_each_network_gets_its_own_owner() public {
        vm.chainId(42161);
        BuoyRegistry registry = factory.deploy(keccak256("arbitrum"));
        assertEq(registry.owner(), 0x3333333333333333333333333333333333333333, "the registry's owner on Arbitrum One");

        vm.chainId(1);
        BuoyRegistry onMainnet = factory.deploy(keccak256("mainnet"));
        assertEq(onMainnet.owner(), 0x1111111111111111111111111111111111111111, "the registry's owner on mainnet");
    }
}
