/// The co-op's next version: the same variables in the same order, one appended.
contract DuesVaultNext {
    address public treasurer;
    uint256 public total;
    mapping(address member => uint256) public paid;
    uint256 public lateFee;

    function version() external pure returns (uint256) {
        return 2;
    }
}

contract CollisionsAndUpgradesTest is Test {
    event Upgraded(address indexed implementation);

    address treasurer = makeAddr("treasurer");
    DuesVault logic;
    DuesProxy proxy;
    DuesVault vault;

    function setUp() public {
        logic = new DuesVault();
        proxy = new DuesProxy(address(logic), abi.encodeCall(DuesVault.initialize, (treasurer)));
        vault = DuesVault(address(proxy));
    }

    function testFuzz_vault_writes_never_reach_the_proxy_state(uint96 a, uint96 b, uint96 c) public {
        uint96[3] memory amounts = [a, b, c];
        for (uint256 i = 0; i < 3; i++) {
            address member = address(uint160(0x1000 + i));
            vm.deal(member, amounts[i]);
            vm.prank(member);
            vault.payDues{value: amounts[i]}();
        }
        assertEq(proxy.implementation(), address(logic), "the proxy's implementation after members paid");
        assertEq(proxy.admin(), address(this), "the proxy's admin after members paid");
        assertEq(vault.treasurer(), treasurer, "the treasurer after members paid");
        assertEq(vault.total(), uint256(a) + b + c, "the total of the dues");
    }

    function test_the_low_slots_belong_to_the_vault() public {
        vm.deal(address(this), 3 ether);
        vault.payDues{value: 3 ether}();
        assertEq(vm.load(address(proxy), bytes32(0)), bytes32(uint256(uint160(treasurer))), "slot 0 of the proxy");
        assertEq(vm.load(address(proxy), bytes32(uint256(1))), bytes32(uint256(3 ether)), "slot 1 of the proxy");
    }

    function test_the_admin_upgrades_and_the_dues_survive() public {
        address member = makeAddr("member");
        vm.deal(member, 2 ether);
        vm.prank(member);
        vault.payDues{value: 2 ether}();

        DuesVaultNext next = new DuesVaultNext();
        vm.expectEmit(address(proxy));
        emit Upgraded(address(next));
        proxy.upgradeTo(address(next));

        DuesVaultNext upgraded = DuesVaultNext(address(proxy));
        assertEq(upgraded.version(), 2, "the version after the upgrade");
        assertEq(upgraded.treasurer(), treasurer, "the treasurer after the upgrade");
        assertEq(upgraded.paid(member), 2 ether, "a member's dues after the upgrade");
        assertEq(address(proxy).balance, 2 ether, "the ether in the proxy after the upgrade");
    }

    function test_only_the_admin_upgrades() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(DuesProxy.NotAdmin.selector, stranger));
        proxy.upgradeTo(stranger);
    }
}
