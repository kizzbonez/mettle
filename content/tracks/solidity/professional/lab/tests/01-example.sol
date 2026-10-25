import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TeaLeafToken1 is ERC20 {
    constructor() ERC20("Leaf", "LEAF") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TeaVaultExampleTest is Test {
    TeaLeafToken1 leaf;
    TeaVaultV1 vault;
    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        leaf = new TeaLeafToken1();
        TeaVaultV1 implementation = new TeaVaultV1();
        bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 50));
        vault = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
        leaf.mint(alice, 10_000e18);
        leaf.mint(bob, 10_000e18);
        vm.prank(alice);
        leaf.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        leaf.approve(address(vault), type(uint256).max);
    }

    function test_example() public {
        vm.prank(alice);
        uint256 aliceShares = vault.deposit(1_000e18, alice);
        assertEq(aliceShares, 1_000_000e18, "Alice's shares for 1,000 LEAF in an empty vault");
        vm.prank(bob);
        vault.deposit(500e18, bob);

        leaf.mint(address(vault), 150e18); // the harvest bonus is paid into the vault

        assertEq(vault.previewRedeem(aliceShares), 1_094_527363184079601989, "previewRedeem of Alice's shares");
        vm.prank(alice);
        uint256 received = vault.redeem(aliceShares, alice, alice);
        assertEq(received, 1_094_527363184079601989, "LEAF Alice received for all her shares");
        assertEq(leaf.balanceOf(treasury), 5_472636815920398010, "the exit fee the treasury received");
        assertEq(vault.totalAssets(), 550e18 + 1, "LEAF left in the vault");

        TeaVaultV2 v2 = new TeaVaultV2();
        vm.prank(owner);
        vault.upgradeToAndCall(address(v2), abi.encodeCall(TeaVaultV2.initializeV2, (2_000e18)));
        TeaVaultV2 upgraded = TeaVaultV2(address(vault));
        assertEq(upgraded.version(), 2, "the version after the upgrade");
        assertEq(upgraded.balanceOf(bob), 500_000e18, "Bob's shares after the upgrade");
        assertEq(upgraded.maxDeposit(bob), 2_000e18 - (550e18 + 1), "maxDeposit under a cap of 2,000 LEAF");
    }
}
