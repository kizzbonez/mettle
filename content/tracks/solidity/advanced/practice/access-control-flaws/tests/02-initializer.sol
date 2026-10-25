contract InitializerTest is Test {
    address warden = makeAddr("warden");
    address mallory = makeAddr("mallory");

    function test_attack_reinitialise_to_take_over() public {
        ObservatoryFund fund = new ObservatoryFund();
        fund.initialise(warden);

        vm.prank(mallory);
        try fund.initialise(mallory) {} catch {}

        assertEq(fund.warden(), warden, "the warden after a second initialise");
    }

    function test_initialises_once_then_refuses() public {
        ObservatoryFund fund = new ObservatoryFund();
        fund.initialise(warden);
        assertEq(fund.warden(), warden, "the warden after initialisation");

        vm.expectRevert(ObservatoryFund.AlreadyInitialised.selector);
        fund.initialise(mallory);
    }

    function test_rejects_the_zero_warden() public {
        ObservatoryFund fund = new ObservatoryFund();
        vm.expectRevert(ObservatoryFund.ZeroAddress.selector);
        fund.initialise(address(0));
    }
}
