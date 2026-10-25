import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";

contract PlainCounterForUpgradeTest {
    uint256 public count;
}

contract UpgradesTest is Test {
    event Stamped(address indexed customer, uint256 stamps);

    address constant BAKER = address(0xBA4E);
    address constant ADA = address(0xADA);
    address constant STRANGER = address(0x5757);

    StampCardV1 card;

    function setUp() public {
        StampCardV1 implementation = new StampCardV1();
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), abi.encodeCall(StampCardV1.initialize, (BAKER)));
        card = StampCardV1(address(proxy));
    }

    function implementationOf(address proxy) internal view returns (address) {
        return address(uint160(uint256(vm.load(proxy, ERC1967Utils.IMPLEMENTATION_SLOT))));
    }

    function test_only_the_owner_upgrades() public {
        StampCardV2 v2 = new StampCardV2();
        address before = implementationOf(address(card));
        vm.prank(STRANGER);
        vm.expectRevert(abi.encodeWithSelector(StampCardV1.NotOwner.selector, STRANGER));
        card.upgradeToAndCall(address(v2), "");
        assertEq(implementationOf(address(card)), before, "the implementation after a refused upgrade");

        vm.prank(BAKER);
        card.upgradeToAndCall(address(v2), abi.encodeCall(StampCardV2.initializeV2, (1)));
        assertEq(implementationOf(address(card)), address(v2), "the implementation after the owner's upgrade");
    }

    function test_refuses_a_contract_that_cannot_upgrade() public {
        PlainCounterForUpgradeTest plain = new PlainCounterForUpgradeTest();
        vm.prank(BAKER);
        vm.expectRevert(abi.encodeWithSelector(ERC1967Utils.ERC1967InvalidImplementation.selector, address(plain)));
        card.upgradeToAndCall(address(plain), "");
    }

    function testFuzz_stamps_survive_the_upgrade(uint256 adaStamps, uint256 benStamps) public {
        adaStamps = bound(adaStamps, 0, 12);
        benStamps = bound(benStamps, 0, 12);
        address ben = address(0xBE4);
        vm.startPrank(BAKER);
        for (uint256 i = 0; i < adaStamps; i++) card.stamp(ADA);
        for (uint256 i = 0; i < benStamps; i++) card.stamp(ben);
        card.upgradeToAndCall(address(new StampCardV2()), abi.encodeCall(StampCardV2.initializeV2, (5)));
        vm.stopPrank();
        StampCardV2 upgraded = StampCardV2(address(card));
        assertEq(upgraded.stampsOf(ADA), adaStamps, "Ada's stamps after the upgrade");
        assertEq(upgraded.stampsOf(ben), benStamps, "Ben's stamps after the upgrade");
        assertEq(upgraded.totalStamps(), adaStamps + benStamps, "totalStamps after the upgrade");
    }

    function test_redeem_rules_after_the_upgrade() public {
        vm.startPrank(BAKER);
        for (uint256 i = 0; i < 7; i++) card.stamp(ADA);
        card.upgradeToAndCall(address(new StampCardV2()), abi.encodeCall(StampCardV2.initializeV2, (5)));
        vm.stopPrank();
        StampCardV2 upgraded = StampCardV2(address(card));

        vm.prank(ADA);
        upgraded.redeem();
        assertEq(upgraded.stampsOf(ADA), 2, "Ada's stamps after one loaf");
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(StampCardV2.NotEnoughStamps.selector, 2, 5));
        upgraded.redeem();

        vm.prank(BAKER);
        vm.expectEmit(address(card));
        emit Stamped(ADA, 3);
        upgraded.stamp(ADA);
        assertEq(upgraded.totalStamps(), 8, "totalStamps counts every stamp ever given");

        StampCardV2 next = new StampCardV2();
        vm.prank(STRANGER);
        vm.expectRevert(abi.encodeWithSelector(StampCardV2.NotOwner.selector, STRANGER));
        upgraded.upgradeToAndCall(address(next), "");
    }
}
