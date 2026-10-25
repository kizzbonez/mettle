import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RolesClubCoin is ERC20 {
    constructor() ERC20("Club Coin", "CLUB") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DuesRolesTest is Test {
    address admin = makeAddr("admin");
    address tess = makeAddr("tess");
    address stranger = makeAddr("stranger");
    RolesClubCoin coin;
    DuesBox box;
    bytes32 treasurer;
    bytes32 steward;

    function setUp() public {
        coin = new RolesClubCoin();
        box = new DuesBox(coin, 10e18, admin, tess);
        treasurer = box.TREASURER_ROLE();
        steward = box.STEWARD_ROLE();
        coin.mint(address(box), 50e18);
    }

    function _unauthorized(address account, bytes32 role) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, account, role);
    }

    function test_the_constructor_sets_up_the_roles() public view {
        assertTrue(box.hasRole(box.DEFAULT_ADMIN_ROLE(), admin), "whether the admin holds DEFAULT_ADMIN_ROLE");
        assertTrue(box.hasRole(treasurer, tess), "whether the treasurer holds TREASURER_ROLE");
        assertEq(box.getRoleAdmin(steward), treasurer, "the admin role of STEWARD_ROLE");
        assertEq(box.getRoleAdmin(treasurer), box.DEFAULT_ADMIN_ROLE(), "the admin role of TREASURER_ROLE");
        assertFalse(box.hasRole(box.DEFAULT_ADMIN_ROLE(), address(this)), "whether the deployer kept an admin role");
    }

    function test_only_the_treasurer_withdraws() public {
        vm.prank(stranger);
        vm.expectRevert(_unauthorized(stranger, treasurer));
        box.withdraw(stranger, 1e18);

        vm.prank(admin);
        vm.expectRevert(_unauthorized(admin, treasurer));
        box.withdraw(admin, 1e18);
    }

    function test_only_stewards_pause_and_unpause() public {
        vm.prank(stranger);
        vm.expectRevert(_unauthorized(stranger, steward));
        box.pause();

        vm.prank(tess);
        vm.expectRevert(_unauthorized(tess, steward));
        box.pause();

        vm.prank(stranger);
        vm.expectRevert(_unauthorized(stranger, steward));
        box.unpause();
    }

    function test_the_treasurer_appoints_stewards_and_the_admin_does_not() public {
        address sam = makeAddr("sam");
        vm.prank(admin);
        vm.expectRevert(_unauthorized(admin, treasurer));
        box.grantRole(steward, sam);

        vm.prank(tess);
        box.grantRole(steward, sam);
        vm.prank(sam);
        box.pause();
        assertTrue(box.paused(), "whether a steward appointed by the treasurer can pause");
    }

    function test_the_admin_appoints_a_new_treasurer() public {
        address theo = makeAddr("theo");
        vm.prank(admin);
        box.grantRole(treasurer, theo);
        vm.prank(theo);
        box.withdraw(theo, 5e18);
        assertEq(coin.balanceOf(theo), 5e18, "what the new treasurer withdrew");
    }
}
