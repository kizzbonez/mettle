contract GardenRunTest is Test {
    function test_run_reads_the_council_from_the_environment() public {
        address council = makeAddr("parish council");
        vm.setEnv("COUNCIL", vm.toString(council));
        DeployGarden script = new DeployGarden();
        (PlotRegistry registry, WaterRota rota) = script.run();
        assertEq(registry.pendingOwner(), council, "the pending owner after run()");
        assertEq(registry.owner(), address(this), "the owner after run(), the account that ran it");
        assertEq(address(registry), script.predictRegistry(address(this)), "the registry's address after run()");
        assertEq(address(rota.registry()), address(registry), "the registry the rota reads");
    }

    function test_run_needs_the_council_variable() public {
        vm.setEnv("COUNCIL", "");
        DeployGarden script = new DeployGarden();
        vm.expectRevert();
        script.run();
    }
}
