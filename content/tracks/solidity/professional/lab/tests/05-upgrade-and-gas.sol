import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TeaLeafToken5 is ERC20 {
    constructor() ERC20("Leaf", "LEAF") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TeaVaultUpgradeGasTest is Test {
    TeaLeafToken5 leaf;
    TeaVaultV1 vault;
    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        leaf = new TeaLeafToken5();
        TeaVaultV1 implementation = new TeaVaultV1();
        bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 50));
        vault = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
        address[2] memory users = [alice, bob];
        for (uint256 i = 0; i < 2; i++) {
            leaf.mint(users[i], 10_000e18);
            vm.prank(users[i]);
            leaf.approve(address(vault), type(uint256).max);
        }
        vm.prank(alice);
        vault.deposit(1_000e18, alice);
        leaf.mint(address(vault), 100e18);
    }

    function _upgrade(uint256 cap) internal returns (TeaVaultV2) {
        TeaVaultV2 v2 = new TeaVaultV2();
        vm.prank(owner);
        vault.upgradeToAndCall(address(v2), abi.encodeCall(TeaVaultV2.initializeV2, (cap)));
        return TeaVaultV2(address(vault));
    }

    function test_the_upgrade_keeps_every_balance_and_setting() public {
        uint256 shares = vault.balanceOf(alice);
        uint256 supply = vault.totalSupply();
        uint256 worth = vault.convertToAssets(shares);
        TeaVaultV2 upgraded = _upgrade(5_000e18);
        assertEq(upgraded.version(), 2, "the version after the upgrade");
        assertEq(upgraded.depositCap(), 5_000e18, "the deposit cap set by initializeV2");
        assertEq(upgraded.balanceOf(alice), shares, "Alice's shares after the upgrade");
        assertEq(upgraded.totalSupply(), supply, "the total supply after the upgrade");
        assertEq(upgraded.convertToAssets(shares), worth, "what Alice's shares are worth after the upgrade");
        assertEq(upgraded.owner(), owner, "the owner after the upgrade");
        assertEq(uint256(upgraded.exitFeeBps()), 50, "the exit fee after the upgrade");
    }

    function test_initializeV2_runs_once_and_only_for_the_owner() public {
        TeaVaultV2 upgraded = _upgrade(5_000e18);
        vm.prank(owner);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        upgraded.initializeV2(1);

        TeaVaultV1 implementation = new TeaVaultV1();
        bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 50));
        TeaVaultV1 other = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
        TeaVaultV2 v2 = new TeaVaultV2();
        vm.prank(owner);
        other.upgradeToAndCall(address(v2), ""); // upgraded without calling initializeV2
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.NotOwner.selector, bob));
        TeaVaultV2(address(other)).initializeV2(type(uint256).max);
    }

    function test_the_cap_limits_deposits_and_mints() public {
        TeaVaultV2 upgraded = _upgrade(2_000e18);
        uint256 room = 2_000e18 - upgraded.totalAssets();
        assertEq(upgraded.maxDeposit(bob), room, "maxDeposit below the cap");
        assertEq(upgraded.maxMint(bob), upgraded.previewDeposit(room), "maxMint below the cap");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.ERC4626ExceededMaxDeposit.selector, bob, room + 1, room));
        upgraded.deposit(room + 1, bob);

        uint256 maxShares = upgraded.maxMint(bob);
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(TeaVaultV1.ERC4626ExceededMaxMint.selector, bob, maxShares + 1, maxShares)
        );
        upgraded.mint(maxShares + 1, bob);

        vm.prank(bob);
        upgraded.deposit(room, bob);
        assertEq(upgraded.maxDeposit(bob), 0, "maxDeposit once the cap is reached");
    }

    function test_maxDeposit_is_zero_above_the_cap() public {
        TeaVaultV2 upgraded = _upgrade(500e18); // the vault already holds 1,100 LEAF
        assertEq(upgraded.maxDeposit(bob), 0, "maxDeposit when the vault holds more than the cap");
        assertEq(upgraded.maxMint(bob), 0, "maxMint when the vault holds more than the cap");
    }

    /// Budgets for one call through the proxy, measured on the sandbox's EVM.
    function test_deposit_and_redeem_stay_within_their_gas_budgets() public {
        uint256 start = gasleft();
        vm.prank(bob);
        uint256 shares = vault.deposit(500e18, bob);
        uint256 depositGas = start - gasleft();
        assertLt(depositGas, 110_000, "gas used by a first deposit from a new depositor");

        start = gasleft();
        vm.prank(bob);
        vault.redeem(shares / 2, bob, bob);
        uint256 redeemGas = start - gasleft();
        assertLt(redeemGas, 125_000, "gas used by a redeem that pays the exit fee");
    }
}
