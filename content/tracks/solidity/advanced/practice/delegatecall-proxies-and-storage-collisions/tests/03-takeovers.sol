import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract TakeoverTest is Test {
    address treasurer = makeAddr("treasurer");
    address attacker = makeAddr("attacker");
    DuesVault logic;
    DuesProxy proxy;
    DuesVault vault;

    function setUp() public {
        logic = new DuesVault();
        proxy = new DuesProxy(address(logic), abi.encodeCall(DuesVault.initialize, (treasurer)));
        vault = DuesVault(address(proxy));
        vm.deal(address(this), 5 ether);
        vault.payDues{value: 5 ether}();
    }

    function test_nobody_takes_over_by_initializing_again() public {
        vm.startPrank(attacker);
        try vault.initialize(attacker) {} catch {}
        try vault.withdraw(attacker, 5 ether) {} catch {}
        vm.stopPrank();
        assertEq(vault.treasurer(), treasurer, "the treasurer after the attacker called initialize");
        assertEq(address(proxy).balance, 5 ether, "the dues after the attacker called initialize");
        assertEq(attacker.balance, 0, "the ether the attacker took");
    }

    function test_a_second_initialize_reverts() public {
        vm.prank(attacker);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        vault.initialize(attacker);
    }

    function test_the_implementation_cannot_be_initialized() public {
        vm.prank(attacker);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        logic.initialize(attacker);
        assertEq(logic.treasurer(), address(0), "the implementation's own treasurer");
    }

    function test_only_the_treasurer_withdraws() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(DuesVault.NotTreasurer.selector, attacker));
        vault.withdraw(attacker, 1 ether);
    }
}
