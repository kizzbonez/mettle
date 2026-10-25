import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ExampleTest is Test {
    event Redeemed(address indexed customer, uint256 stampsLeft);

    address constant BAKER = address(0xBA4E);
    address constant ADA = address(0xADA);

    function test_example() public {
        StampCardV1 implementation = new StampCardV1();
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), abi.encodeCall(StampCardV1.initialize, (BAKER)));
        StampCardV1 card = StampCardV1(address(proxy));
        assertEq(card.owner(), BAKER, "the owner after initialize");

        vm.startPrank(BAKER);
        card.stamp(ADA);
        card.stamp(ADA);
        card.stamp(ADA);
        StampCardV2 v2 = new StampCardV2();
        card.upgradeToAndCall(address(v2), abi.encodeCall(StampCardV2.initializeV2, (3)));
        vm.stopPrank();

        StampCardV2 upgraded = StampCardV2(address(proxy));
        assertEq(upgraded.version(), 2, "the version after the upgrade");
        assertEq(upgraded.stampsOf(ADA), 3, "Ada's stamps after the upgrade");
        assertEq(upgraded.totalStamps(), 3, "totalStamps after the upgrade");
        assertEq(upgraded.threshold(), 3, "the threshold set by initializeV2");

        vm.prank(ADA);
        vm.expectEmit(address(proxy));
        emit Redeemed(ADA, 0);
        upgraded.redeem();
        assertEq(upgraded.stampsOf(ADA), 0, "Ada's stamps after redeeming a loaf");
    }
}
