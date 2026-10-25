import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";

contract TeaLeafToken2 is ERC20 {
    constructor() ERC20("Leaf", "LEAF") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TeaVaultProxyAdminTest is Test {
    event ExitFeeChanged(uint16 previousBps, uint16 newBps);

    TeaLeafToken2 leaf;
    TeaVaultV1 implementation;
    TeaVaultV1 vault;
    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address mallory = makeAddr("mallory");

    function setUp() public {
        leaf = new TeaLeafToken2();
        implementation = new TeaVaultV1();
        vault = TeaVaultV1(address(new ERC1967Proxy(address(implementation), _init(50))));
    }

    function _init(uint16 fee) internal view returns (bytes memory) {
        return abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, fee));
    }

    function test_initialize_sets_the_vault_up() public view {
        assertEq(vault.asset(), address(leaf), "the vault's asset");
        assertEq(vault.owner(), owner, "the vault's owner");
        assertEq(vault.treasury(), treasury, "the vault's treasury");
        assertEq(uint256(vault.exitFeeBps()), 50, "the vault's exit fee");
        assertEq(uint256(vault.decimals()), 21, "the share decimals (asset decimals plus the offset)");
    }

    function test_the_implementation_cannot_be_initialized() public {
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        implementation.initialize(IERC20(address(leaf)), mallory, mallory, 0);
    }

    function test_the_proxy_initializes_only_once() public {
        vm.prank(mallory);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        vault.initialize(IERC20(address(leaf)), mallory, mallory, 0);
        assertEq(vault.owner(), owner, "the owner after a second initialize");
    }

    function test_initialize_refuses_a_fee_above_the_maximum() public {
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.FeeTooHigh.selector, uint16(201), uint16(200)));
        new ERC1967Proxy(address(implementation), _init(201));
    }

    function test_initialize_refuses_zero_addresses() public {
        bytes memory noTreasury = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, address(0), 50));
        vm.expectRevert(TeaVaultV1.ZeroAddress.selector);
        new ERC1967Proxy(address(implementation), noTreasury);
    }

    function test_state_lives_in_the_namespace() public view {
        bytes32 base = bytes32(erc7201("mettle.storage.TeaVault"));
        bytes32 ownerWord = vm.load(address(vault), bytes32(uint256(base) + 1));
        assertEq(address(uint160(uint256(ownerWord))), owner, "the owner in the namespace's second slot");
        assertEq(vm.load(address(vault), bytes32(0)), bytes32(0), "the proxy's slot 0");
    }

    function test_only_the_owner_upgrades() public {
        TeaVaultV2 v2 = new TeaVaultV2();
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.NotOwner.selector, mallory));
        vault.upgradeToAndCall(address(v2), "");

        vm.prank(owner);
        vault.upgradeToAndCall(address(v2), "");
        bytes32 slot = vm.load(address(vault), ERC1967Utils.IMPLEMENTATION_SLOT);
        assertEq(address(uint160(uint256(slot))), address(v2), "the implementation slot after the owner's upgrade");
    }

    function test_setExitFee_rules() public {
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.NotOwner.selector, mallory));
        vault.setExitFee(0);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TeaVaultV1.FeeTooHigh.selector, uint16(250), uint16(200)));
        vault.setExitFee(250);

        vm.expectEmit(address(vault));
        emit ExitFeeChanged(50, 120);
        vm.prank(owner);
        vault.setExitFee(120);
        assertEq(uint256(vault.exitFeeBps()), 120, "the exit fee after setExitFee(120)");
    }
}
