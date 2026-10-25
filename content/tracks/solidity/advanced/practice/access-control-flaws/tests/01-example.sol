contract ObservatoryExampleTest is Test {
    event Spent(address indexed to, uint256 amount);

    ObservatoryFund fund;
    address warden = makeAddr("warden");
    address keeper = makeAddr("keeper");
    address mallory = makeAddr("mallory");

    function setUp() public {
        fund = new ObservatoryFund();
        fund.initialise(warden);
        hoax(makeAddr("donor"), 10 ether);
        fund.donate{value: 4 ether}();
    }

    function test_example() public {
        vm.prank(warden);
        fund.addKeeper(keeper);
        assertTrue(fund.isKeeper(keeper), "the keeper is appointed");

        vm.prank(keeper);
        fund.logNight();
        assertEq(fund.nights(), 1, "nights after the keeper logged one");

        vm.expectEmit(address(fund));
        emit Spent(warden, 1 ether);
        vm.prank(warden);
        fund.spend(warden, 1 ether);
        assertEq(address(fund).balance, 3 ether, "the fund after the warden spent 1 ether");
    }

    /// Attack test: once the warden is set, a stranger tries to seize the fund by re-initialising
    /// it to themselves.
    function test_attack_seize_the_initializer() public {
        vm.prank(mallory);
        try fund.initialise(mallory) {} catch {}

        assertEq(fund.warden(), warden, "the warden after a stranger tried to re-initialise");
    }
}
