/// Test helper: a member contract whose receive() calls withdrawAll() again while it is paid.
contract EchoMember {
    CoopVault immutable vault;

    constructor(CoopVault vault_) {
        vault = vault_;
    }

    function joinAndLeave() external payable {
        vault.deposit{value: msg.value}();
        vault.withdrawAll();
    }

    receive() external payable {
        if (address(vault).balance >= msg.value) {
            try vault.withdrawAll() {} catch {}
        }
    }
}

contract CoopExampleTest is Test {
    event Withdrawn(address indexed member, uint256 amount);

    CoopVault vault;
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");

    function setUp() public {
        vault = new CoopVault();
        hoax(ada, 1 ether);
        vault.deposit{value: 0.3 ether}();
    }

    function test_example() public {
        vm.prank(ada);
        vault.transferDeposit(ben, 0.1 ether);
        assertEq(vault.depositOf(ben), 0.1 ether, "ben's deposit after ada moved some to him");

        vm.expectEmit(address(vault));
        emit Withdrawn(ben, 0.1 ether);
        vm.prank(ben);
        vault.withdrawAll();
        assertEq(ben.balance, 0.1 ether, "ben's ether after withdrawing");
        assertEq(vault.depositOf(ben), 0, "ben's deposit after withdrawing");

        vm.prank(ada);
        vault.claimBadge();
        assertEq(vault.ownerOf(1), ada, "the owner of badge 1");

        vm.prank(ada);
        vm.expectRevert(CoopVault.AlreadyClaimed.selector);
        vault.claimBadge();
    }

    function test_regression_a_member_reenters_withdrawAll() public {
        EchoMember echo = new EchoMember(vault);
        vm.deal(address(this), 0.1 ether);
        try echo.joinAndLeave{value: 0.1 ether}() {} catch {}

        assertLe(address(echo).balance, 0.1 ether, "ether the reentering member ended with");
        assertEq(address(vault).balance, 0.3 ether, "ada's deposit still in the vault");
        assertEq(vault.depositOf(ada), 0.3 ether, "ada's recorded deposit");
    }
}
