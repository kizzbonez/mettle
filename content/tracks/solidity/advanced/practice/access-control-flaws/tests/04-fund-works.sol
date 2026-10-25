contract FundWorksTest is Test {
    event KeeperAdded(address indexed keeper);
    event NightLogged(address indexed keeper, uint256 nights);

    ObservatoryFund fund;
    address warden = makeAddr("warden");
    address keeper = makeAddr("keeper");

    function setUp() public {
        fund = new ObservatoryFund();
        fund.initialise(warden);
        hoax(makeAddr("donor"), 10 ether);
        fund.donate{value: 6 ether}();
    }

    function test_warden_manages_keepers() public {
        vm.expectEmit(address(fund));
        emit KeeperAdded(keeper);
        vm.prank(warden);
        fund.addKeeper(keeper);
        assertTrue(fund.isKeeper(keeper), "the keeper after being added");

        vm.prank(warden);
        fund.removeKeeper(keeper);
        assertFalse(fund.isKeeper(keeper), "the keeper after being removed");
    }

    function test_keepers_log_nights_others_cannot() public {
        vm.prank(warden);
        fund.addKeeper(keeper);

        vm.expectEmit(address(fund));
        emit NightLogged(keeper, 1);
        vm.prank(keeper);
        fund.logNight();
        assertEq(fund.nights(), 1, "nights after a keeper logged one");

        vm.prank(makeAddr("stranger"));
        vm.expectRevert(abi.encodeWithSelector(ObservatoryFund.NotKeeper.selector, makeAddr("stranger")));
        fund.logNight();
    }

    function test_warden_spends_from_their_own_account() public {
        vm.prank(warden);
        fund.spend(makeAddr("shop"), 2 ether);
        assertEq(makeAddr("shop").balance, 2 ether, "the shop's ether after the warden paid it");
        assertEq(address(fund).balance, 4 ether, "the fund after spending");
    }

    function test_spend_rejects_too_much() public {
        vm.prank(warden);
        vm.expectRevert(abi.encodeWithSelector(ObservatoryFund.InsufficientFunds.selector, 6 ether, 7 ether));
        fund.spend(warden, 7 ether);
    }

    function testFuzz_only_the_warden_spends(address caller, uint256 amount) public {
        vm.assume(caller != warden);
        amount = bound(amount, 0, 6 ether);
        vm.prank(caller, caller);
        vm.expectRevert(abi.encodeWithSelector(ObservatoryFund.NotWarden.selector, caller));
        fund.spend(caller, amount);
    }
}
