import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TeaLeafToken3 is ERC20 {
    constructor() ERC20("Leaf", "LEAF") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TeaVaultShareMathTest is Test {
    TeaLeafToken3 leaf;
    TeaVaultV1 vault;
    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        leaf = new TeaLeafToken3();
        TeaVaultV1 implementation = new TeaVaultV1();
        bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 50));
        vault = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
        address[2] memory users = [alice, bob];
        for (uint256 i = 0; i < 2; i++) {
            leaf.mint(users[i], 1_000_000e18);
            vm.prank(users[i]);
            leaf.approve(address(vault), type(uint256).max);
        }
        // An uneven price: 1,000 LEAF deposited, then a harvest of 333 LEAF.
        vm.prank(alice);
        vault.deposit(1_000e18, alice);
        leaf.mint(address(vault), 333e18);
    }

    function test_virtual_shares_in_an_empty_vault() public {
        TeaVaultV1 implementation = new TeaVaultV1();
        bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 50));
        TeaVaultV1 fresh = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
        assertEq(fresh.convertToShares(1), 1_000, "shares for 1 wei in an empty vault (10**3 virtual shares)");
        assertEq(fresh.convertToAssets(1_000), 1, "assets for 1,000 shares in an empty vault");
    }

    function test_conversions_round_down_and_charges_round_up() public view {
        uint256 assets = 7e18 + 3;
        uint256 shares = 5e21 + 7;
        assertEq(
            vault.previewDeposit(assets),
            vault.convertToShares(assets),
            "previewDeposit rounds down like convertToShares"
        );
        assertEq(vault.previewMint(shares), vault.convertToAssets(shares) + 1, "previewMint rounds up");
        uint256 exact = vault.convertToShares(assets);
        assertGt(vault.previewWithdraw(assets), exact, "previewWithdraw charges more shares than convertToShares");
    }

    function testFuzz_previews_match_deposit_and_mint(uint96 assets, uint96 shares) public {
        assets = uint96(bound(assets, 1, 100_000e18));
        shares = uint96(bound(shares, 1, 50_000_000e18));
        uint256 predictedShares = vault.previewDeposit(assets);
        vm.prank(bob);
        assertEq(vault.deposit(assets, bob), predictedShares, "deposit compared with previewDeposit");

        uint256 predictedAssets = vault.previewMint(shares);
        uint256 before = leaf.balanceOf(bob);
        vm.prank(bob);
        assertEq(vault.mint(shares, bob), predictedAssets, "mint compared with previewMint");
        assertEq(before - leaf.balanceOf(bob), predictedAssets, "LEAF taken by mint compared with previewMint");
    }

    function testFuzz_previews_match_withdraw_and_redeem(uint96 assets, uint96 shares) public {
        assets = uint96(bound(assets, 1, 1_000e18));
        uint256 predictedShares = vault.previewWithdraw(assets);
        uint256 sharesBefore = vault.balanceOf(alice);
        vm.prank(alice);
        assertEq(vault.withdraw(assets, alice, alice), predictedShares, "withdraw compared with previewWithdraw");
        assertEq(sharesBefore - vault.balanceOf(alice), predictedShares, "shares burned by withdraw");

        shares = uint96(bound(shares, 1, vault.balanceOf(alice)));
        uint256 predictedAssets = vault.previewRedeem(shares);
        uint256 leafBefore = leaf.balanceOf(alice);
        vm.prank(alice);
        assertEq(vault.redeem(shares, alice, alice), predictedAssets, "redeem compared with previewRedeem");
        assertEq(leaf.balanceOf(alice) - leafBefore, predictedAssets, "LEAF paid by redeem");
    }

    function testFuzz_a_round_trip_never_profits(uint96 assets) public {
        assets = uint96(bound(assets, 1, 100_000e18));
        vm.startPrank(bob);
        uint256 shares = vault.deposit(assets, bob);
        uint256 back = vault.redeem(shares, bob, bob);
        vm.stopPrank();
        assertLe(back, assets, "LEAF back after depositing and redeeming at once");
    }

    function test_a_donation_to_an_empty_vault_does_not_rob_the_next_depositor() public {
        TeaVaultV1 implementation = new TeaVaultV1();
        bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 0));
        TeaVaultV1 fresh = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
        address attacker = makeAddr("attacker");
        leaf.mint(attacker, 10_000e18 + 1);
        vm.startPrank(attacker);
        leaf.approve(address(fresh), type(uint256).max);
        fresh.deposit(1, attacker);
        leaf.transfer(address(fresh), 10_000e18);
        vm.stopPrank();

        vm.startPrank(bob);
        leaf.approve(address(fresh), type(uint256).max);
        uint256 shares = fresh.deposit(10_000e18, bob);
        vm.stopPrank();
        assertGe(
            fresh.convertToAssets(shares),
            9_990e18,
            "what the next depositor's 10,000 LEAF are worth after the donation"
        );
    }
}
