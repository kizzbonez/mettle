contract AnyDayTest is Test {
    function testFuzz_any_day(uint8 morning, uint8 afternoon, uint8 team) public {
        HarvestDay day = new HarvestDay();
        uint8 pickers = uint8(bound(team, 1, 255));
        uint256 expected = (uint256(morning) + uint256(afternoon)) * 0.004 ether / pickers;
        assertEq(day.share(morning, afternoon, pickers), expected, "the share for a fuzzed day");
    }

    function test_keeps_the_settings() public {
        address farmOffice = address(0xF4A);
        vm.prank(farmOffice);
        HarvestDay day = new HarvestDay();
        assertEq(day.farm(), farmOffice, "the farm, set to the deployer");
        assertEq(day.BUNDLE_PRICE(), 0.004 ether, "BUNDLE_PRICE");
        assertEq(day.SHIFT(), 14_400, "SHIFT in seconds");
    }
}
