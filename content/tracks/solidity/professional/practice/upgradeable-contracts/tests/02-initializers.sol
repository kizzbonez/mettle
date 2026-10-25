import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract InitializersTest is Test {
    address constant BAKER = address(0xBA4E);
    address constant STRANGER = address(0x5757);

    function deployCard() internal returns (StampCardV1) {
        StampCardV1 implementation = new StampCardV1();
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), abi.encodeCall(StampCardV1.initialize, (BAKER)));
        return StampCardV1(address(proxy));
    }

    function test_initialize_runs_only_once() public {
        StampCardV1 card = deployCard();
        vm.prank(STRANGER);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        card.initialize(STRANGER);
        assertEq(card.owner(), BAKER, "the owner after a second initialize was refused");
    }

    function test_the_implementations_are_locked() public {
        StampCardV1 one = new StampCardV1();
        vm.prank(STRANGER);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        one.initialize(STRANGER);

        StampCardV2 two = new StampCardV2();
        vm.prank(STRANGER);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        two.initializeV2(1);
    }

    function test_the_owner_cannot_be_zero() public {
        StampCardV1 implementation = new StampCardV1();
        vm.expectRevert(StampCardV1.ZeroOwner.selector);
        new ERC1967Proxy(address(implementation), abi.encodeCall(StampCardV1.initialize, (address(0))));
    }

    function test_initialize_v2_belongs_to_the_owner_and_runs_once() public {
        StampCardV1 card = deployCard();
        StampCardV2 v2 = new StampCardV2();
        vm.prank(BAKER);
        card.upgradeToAndCall(address(v2), ""); // upgraded without calling initializeV2
        StampCardV2 upgraded = StampCardV2(address(card));

        vm.prank(STRANGER);
        vm.expectRevert(abi.encodeWithSelector(StampCardV2.NotOwner.selector, STRANGER));
        upgraded.initializeV2(1);

        vm.prank(BAKER);
        vm.expectRevert(StampCardV2.ZeroThreshold.selector);
        upgraded.initializeV2(0);

        vm.prank(BAKER);
        upgraded.initializeV2(4);
        assertEq(upgraded.threshold(), 4, "the threshold after initializeV2");

        vm.prank(BAKER);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        upgraded.initializeV2(9);
        assertEq(upgraded.threshold(), 4, "the threshold after a second initializeV2 was refused");
    }
}
