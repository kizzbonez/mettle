import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StorageLayoutTest is Test {
    address constant BAKER = address(0xBA4E);
    address constant ADA = address(0xADA);
    address constant BEN = address(0xBE4);

    StampCardV1 card;
    uint256 base;

    function setUp() public {
        base = uint256(keccak256(abi.encode(uint256(keccak256("bakery.storage.StampCard")) - 1)) & ~bytes32(uint256(0xff)));
        StampCardV1 implementation = new StampCardV1();
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), abi.encodeCall(StampCardV1.initialize, (BAKER)));
        card = StampCardV1(address(proxy));
        vm.startPrank(BAKER);
        card.stamp(ADA);
        card.stamp(ADA);
        card.stamp(BEN);
        vm.stopPrank();
    }

    function at(uint256 slot) internal view returns (uint256) {
        return uint256(vm.load(address(card), bytes32(slot)));
    }

    function test_version_one_uses_the_namespace() public view {
        assertEq(at(base), uint256(uint160(BAKER)), "the owner in the namespace's first slot");
        assertEq(at(uint256(keccak256(abi.encode(ADA, base + 1)))), 2, "Ada's stamps in the namespace's mapping");
        assertEq(at(base + 2), 3, "totalStamps in the namespace's third slot");
        for (uint256 slot = 0; slot < 4; slot++) {
            assertEq(at(slot), 0, "the proxy's storage outside the namespace");
        }
    }

    function test_version_two_appends_the_threshold() public {
        StampCardV2 v2 = new StampCardV2();
        vm.prank(BAKER);
        card.upgradeToAndCall(address(v2), abi.encodeCall(StampCardV2.initializeV2, (6)));
        assertEq(at(base), uint256(uint160(BAKER)), "the owner slot after the upgrade");
        assertEq(at(uint256(keccak256(abi.encode(ADA, base + 1)))), 2, "Ada's stamps slot after the upgrade");
        assertEq(at(base + 2), 3, "the totalStamps slot after the upgrade");
        assertEq(at(base + 3), 6, "the threshold in the slot after totalStamps");
        StampCardV2 upgraded = StampCardV2(address(card));
        assertEq(upgraded.owner(), BAKER, "owner() after the upgrade");
        assertEq(upgraded.stampsOf(BEN), 1, "Ben's stamps after the upgrade");
    }
}
