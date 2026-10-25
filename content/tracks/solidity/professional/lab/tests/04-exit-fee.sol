import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TeaLeafToken4 is ERC20 {
    constructor() ERC20("Leaf", "LEAF") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TeaVaultExitFeeTest is Test {
    TeaLeafToken4 leaf;
    TeaVaultV1 vault;
    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address carol = makeAddr("carol");

    function setUp() public {
        leaf = new TeaLeafToken4();
        TeaVaultV1 implementation = new TeaVaultV1();
        bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 50));
        vault = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
        leaf.mint(alice, 10_000e18);
        vm.startPrank(alice);
        leaf.approve(address(vault), type(uint256).max);
        vault.deposit(2_000e18, alice);
        vm.stopPrank();
    }

    function test_redeem_pays_the_fee_to_the_treasury() public {
        uint256 shares = vault.balanceOf(alice) / 2; // worth 1,000 LEAF
        uint256 gross = vault.convertToAssets(shares);
        vm.prank(alice);
        uint256 received = vault.redeem(shares, alice, alice);
        uint256 fee = leaf.balanceOf(treasury);
        assertEq(received + fee, gross, "what Alice received plus the fee, against what the shares were worth");
        assertEq(fee, 4_975124378109452737, "the fee on redeeming 1,000 LEAF worth of shares at 0.5%");
    }

    function test_withdraw_pays_the_exact_assets_and_the_fee_on_top() public {
        uint256 before = leaf.balanceOf(alice);
        vm.prank(alice);
        vault.withdraw(1_000e18, alice, alice);
        assertEq(leaf.balanceOf(alice) - before, 1_000e18, "LEAF Alice received from withdraw(1,000)");
        assertEq(leaf.balanceOf(treasury), 5e18, "the fee on withdrawing 1,000 LEAF at 0.5%");
    }

    function test_the_fee_rounds_up_on_tiny_amounts() public {
        vm.prank(alice);
        vault.withdraw(1, alice, alice);
        assertEq(leaf.balanceOf(treasury), 1, "the fee on withdrawing 1 wei");

        uint256 shares = vault.convertToShares(100);
        uint256 gross = vault.convertToAssets(shares);
        vm.prank(alice);
        uint256 received = vault.redeem(shares, alice, alice);
        assertEq(received, gross - 1, "LEAF received for shares worth about 100 wei");
    }

    function test_no_fee_when_it_is_zero() public {
        vm.prank(owner);
        vault.setExitFee(0);
        uint256 shares = vault.balanceOf(alice);
        uint256 gross = vault.convertToAssets(shares);
        vm.prank(alice);
        uint256 received = vault.redeem(shares, alice, alice);
        assertEq(received, gross, "LEAF received with a zero exit fee");
        assertEq(leaf.balanceOf(treasury), 0, "the treasury's balance with a zero exit fee");
    }

    function test_redeeming_for_someone_else_needs_an_allowance() public {
        uint256 shares = 1_000e21;
        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.ERC20InsufficientAllowance.selector, carol, 0, shares));
        vault.redeem(shares, carol, alice);

        vm.prank(alice);
        vault.approve(carol, 1_500e21);
        vm.prank(carol);
        uint256 received = vault.redeem(shares, carol, alice);
        assertEq(leaf.balanceOf(carol), received, "LEAF Carol received for Alice's shares");
        assertEq(vault.allowance(alice, carol), 500e21, "Carol's allowance after redeeming 1,000 vLEAF");
    }

    function test_the_max_functions_hold() public {
        uint256 maxAssets = vault.maxWithdraw(alice);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(TeaVaultV1.ERC4626ExceededMaxWithdraw.selector, alice, maxAssets + 1, maxAssets)
        );
        vault.withdraw(maxAssets + 1, alice, alice);

        uint256 shares = vault.balanceOf(alice);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.ERC4626ExceededMaxRedeem.selector, alice, shares + 1, shares));
        vault.redeem(shares + 1, alice, alice);

        vm.prank(alice);
        vault.withdraw(maxAssets, alice, alice);
        assertLe(
            vault.convertToAssets(vault.balanceOf(alice)),
            2,
            "LEAF Alice's remaining shares are worth after withdrawing maxWithdraw"
        );
    }
}
