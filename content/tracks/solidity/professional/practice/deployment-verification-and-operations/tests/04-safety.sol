contract BuoySafetyTest is Test {
    BuoyDeployer factory;
    BuoyRegistry registry;
    bytes32 constant SALT = keccak256("buoy-registry-v1");

    function setUp() public {
        factory = new BuoyDeployer();
        vm.chainId(10);
        registry = factory.deploy(SALT);
    }

    function test_the_owner_is_set_in_the_deploying_transaction() public view {
        assertEq(registry.owner(), 0x2222222222222222222222222222222222222222, "the owner right after deploy");
    }

    function test_nobody_can_take_ownership_afterwards() public {
        address mallory = makeAddr("mallory");
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(BuoyRegistry.NotDeployer.selector, mallory));
        registry.initialize(mallory);

        vm.prank(address(factory));
        vm.expectRevert(BuoyRegistry.AlreadyInitialized.selector);
        registry.initialize(mallory);
        assertEq(registry.owner(), 0x2222222222222222222222222222222222222222, "the owner after attempts to change it");
    }

    function test_a_second_deployment_with_the_same_salt_is_refused() public {
        vm.chainId(10);
        vm.expectRevert(abi.encodeWithSelector(BuoyDeployer.AlreadyDeployed.selector, address(registry)));
        factory.deploy(SALT);
    }

    function test_anyone_may_run_the_deployment() public {
        // The result does not depend on who calls: the owner always comes from the table.
        vm.chainId(1);
        vm.prank(makeAddr("stranger"));
        BuoyRegistry onMainnet = factory.deploy(keccak256("other"));
        assertEq(onMainnet.owner(), 0x1111111111111111111111111111111111111111, "the owner when a stranger runs deploy");
    }
}
