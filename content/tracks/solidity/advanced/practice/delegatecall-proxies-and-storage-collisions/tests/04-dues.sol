contract NoEtherHere {
    receive() external payable {
        revert("no ether");
    }
}

contract DuesTest is Test {
    event DuesPaid(address indexed member, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    address treasurer = makeAddr("treasurer");
    DuesProxy proxy;
    DuesVault vault;

    function setUp() public {
        proxy = new DuesProxy(address(new DuesVault()), abi.encodeCall(DuesVault.initialize, (treasurer)));
        vault = DuesVault(address(proxy));
    }

    function testFuzz_dues_add_up(uint96 first, uint96 second) public {
        address member = makeAddr("member");
        vm.deal(member, uint256(first) + second);
        vm.startPrank(member);
        vm.expectEmit(address(proxy));
        emit DuesPaid(member, first);
        vault.payDues{value: first}();
        vault.payDues{value: second}();
        vm.stopPrank();
        assertEq(vault.paid(member), uint256(first) + second, "a member's dues after two payments");
        assertEq(vault.total(), uint256(first) + second, "the total after two payments");
        assertEq(address(proxy).balance, uint256(first) + second, "the ether held by the proxy");
    }

    function test_withdraw_pays_and_announces() public {
        vm.deal(address(this), 1 ether);
        vault.payDues{value: 1 ether}();
        address shop = makeAddr("shop");
        vm.expectEmit(address(proxy));
        emit Withdrawn(shop, 0.4 ether);
        vm.prank(treasurer);
        vault.withdraw(shop, 0.4 ether);
        assertEq(shop.balance, 0.4 ether, "the ether paid to the shop");
        assertEq(vault.total(), 0.6 ether, "the dues left after a withdrawal");
    }

    function test_a_refused_payment_reverts() public {
        vm.deal(address(this), 1 ether);
        vault.payDues{value: 1 ether}();
        address refuser = address(new NoEtherHere());
        vm.prank(treasurer);
        vm.expectRevert(DuesVault.PaymentFailed.selector);
        vault.withdraw(refuser, 1 ether);
        assertEq(vault.total(), 1 ether, "the dues after a refused payment");
    }
}
