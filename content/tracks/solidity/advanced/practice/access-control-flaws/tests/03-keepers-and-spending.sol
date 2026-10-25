/// Test helper: an innocent-looking contract the warden is lured into calling, which spends the
/// fund in the warden's name through a tx.origin check.
contract NightSkyMap {
    ObservatoryFund immutable fund;
    address immutable thief;

    constructor(ObservatoryFund fund_, address thief_) {
        fund = fund_;
        thief = thief_;
    }

    function viewMap() external {
        fund.spend(thief, address(fund).balance);
    }
}

contract KeepersAndSpendingTest is Test {
    event KeeperAdded(address indexed keeper);

    ObservatoryFund fund;
    address warden = makeAddr("warden");
    address keeper = makeAddr("keeper");
    address mallory = makeAddr("mallory");

    function setUp() public {
        fund = new ObservatoryFund();
        fund.initialise(warden);
        hoax(makeAddr("donor"), 10 ether);
        fund.donate{value: 5 ether}();
    }

    function test_attack_appoint_yourself_a_keeper() public {
        vm.prank(mallory);
        try fund.addKeeper(mallory) {} catch {}
        assertFalse(fund.isKeeper(mallory), "a stranger made themselves a keeper");

        vm.prank(mallory);
        try fund.logNight() {} catch {}
        assertEq(fund.nights(), 0, "nights logged by a self-appointed keeper");
    }

    function test_attack_remove_a_real_keeper() public {
        vm.prank(warden);
        fund.addKeeper(keeper);
        vm.prank(mallory);
        try fund.removeKeeper(keeper) {} catch {}
        assertTrue(fund.isKeeper(keeper), "the keeper after a stranger tried to remove them");
    }

    function test_attack_spend_through_a_tricked_warden() public {
        NightSkyMap map = new NightSkyMap(fund, mallory);
        // The warden is phished into calling a contract: msg.sender is the contract, but
        // tx.origin is still the warden.
        vm.prank(warden, warden);
        try map.viewMap() {} catch {}

        assertEq(mallory.balance, 0, "ether a tricked warden was made to spend");
        assertEq(address(fund).balance, 5 ether, "the fund after the phishing attempt");
    }

    function test_attack_spend_directly() public {
        vm.prank(mallory, mallory);
        try fund.spend(mallory, 5 ether) {} catch {}
        assertEq(mallory.balance, 0, "ether a stranger spent directly");
    }
}
