contract GardenExampleTest is Test {
    function test_example() public {
        address deployer = makeAddr("deployer");
        address council = makeAddr("council");
        address[] memory holders = new address[](2);
        holders[0] = makeAddr("ana");
        holders[1] = makeAddr("ben");

        DeployGarden script = new DeployGarden();
        address predicted = script.predictRegistry(deployer);
        console.log("predicted registry:", predicted);

        (PlotRegistry registry, WaterRota rota) = script.deploy(deployer, council, holders);
        console.log("deployed registry: ", address(registry));
        console.log("deployed rota:     ", address(rota));

        assertEq(address(registry), predicted, "the registry's address compared with the prediction");
        assertEq(registry.owner(), deployer, "the registry's owner right after the deployment");
        assertEq(registry.pendingOwner(), council, "the registry's pending owner");
        assertEq(registry.rota(), address(rota), "the rota recorded in the registry");
        assertEq(address(rota.registry()), address(registry), "the registry the rota reads");
        assertEq(registry.holderOf(1), holders[0], "the holder of plot 1");
        assertEq(registry.holderOf(2), holders[1], "the holder of plot 2");

        vm.prank(council);
        registry.acceptOwnership();
        assertEq(registry.owner(), council, "the registry's owner after the council accepted");
    }
}
