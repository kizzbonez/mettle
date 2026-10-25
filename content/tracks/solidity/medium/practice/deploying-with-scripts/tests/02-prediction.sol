contract GardenPredictionTest is Test {
    DeployGarden script;

    function setUp() public {
        script = new DeployGarden();
    }

    function _initCodeHash(address deployer) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(type(PlotRegistry).creationCode, abi.encode(deployer)));
    }

    function testFuzz_matches_the_create2_formula(address deployer) public view {
        assertEq(
            script.predictRegistry(deployer),
            vm.computeCreate2Address(script.SALT(), _initCodeHash(deployer), CREATE2_FACTORY),
            "the prediction compared with CREATE2 through the factory"
        );
    }

    function test_the_creator_in_the_formula_is_the_factory() public {
        address deployer = makeAddr("deployer");
        assertTrue(
            script.predictRegistry(deployer)
                != vm.computeCreate2Address(script.SALT(), _initCodeHash(deployer), address(script)),
            "whether the prediction differs from CREATE2 by the script itself"
        );
    }

    function test_the_constructor_argument_changes_the_address() public {
        assertTrue(
            script.predictRegistry(makeAddr("deployer")) != script.predictRegistry(makeAddr("another deployer")),
            "whether two deployers get two different registry addresses"
        );
        assertTrue(
            script.predictRegistry(makeAddr("deployer"))
                != vm.computeCreate2Address(script.SALT(), keccak256(type(PlotRegistry).creationCode), CREATE2_FACTORY),
            "whether the prediction includes the constructor argument"
        );
    }

    function test_the_prediction_does_not_depend_on_the_script_instance() public {
        DeployGarden other = new DeployGarden();
        address deployer = makeAddr("deployer");
        assertEq(other.predictRegistry(deployer), script.predictRegistry(deployer), "the prediction of a second script");
    }

    function test_the_deployment_lands_on_the_prediction() public {
        address deployer = makeAddr("someone else");
        address predicted = script.predictRegistry(deployer);
        assertEq(predicted.code.length, 0, "the code at the predicted address before the deployment");
        (PlotRegistry registry,) = script.deploy(deployer, makeAddr("council"), new address[](0));
        assertEq(address(registry), predicted, "the registry's address compared with the prediction");
        assertGt(predicted.code.length, 0, "the code at the predicted address after the deployment");
    }
}
