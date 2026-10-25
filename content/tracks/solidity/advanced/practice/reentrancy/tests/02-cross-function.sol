/// Test helper: while it is paid, it moves its not-yet-cleared deposit to a friend.
contract SideStepMember {
    CoopVault immutable vault;
    address immutable friend;

    constructor(CoopVault vault_, address friend_) {
        vault = vault_;
        friend = friend_;
    }

    function joinAndLeave() external payable {
        vault.deposit{value: msg.value}();
        vault.withdrawAll();
    }

    receive() external payable {
        try vault.transferDeposit(friend, msg.value) {} catch {}
    }
}

contract CrossFunctionReentryTest is Test {
    event DepositMoved(address indexed from, address indexed to, uint256 amount);

    CoopVault vault;
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    address friend = makeAddr("friend");

    function setUp() public {
        vault = new CoopVault();
        hoax(ada, 1 ether);
        vault.deposit{value: 0.3 ether}();
    }

    function test_regression_a_paid_deposit_cannot_also_be_moved() public {
        SideStepMember member = new SideStepMember(vault, friend);
        vm.deal(address(this), 0.2 ether);
        try member.joinAndLeave{value: 0.2 ether}() {} catch {}

        assertEq(vault.depositOf(friend), 0, "deposit the friend received during the withdrawal");
        vm.prank(friend);
        try vault.withdrawAll() {} catch {}
        assertEq(friend.balance, 0, "ether the friend could withdraw afterwards");
        assertEq(address(vault).balance, 0.3 ether, "ada's deposit still in the vault");
    }

    function test_moves_a_deposit() public {
        vm.expectEmit(address(vault));
        emit DepositMoved(ada, ben, 0.12 ether);
        vm.prank(ada);
        vault.transferDeposit(ben, 0.12 ether);
        assertEq(vault.depositOf(ada), 0.18 ether, "ada's deposit after the move");
        assertEq(vault.depositOf(ben), 0.12 ether, "ben's deposit after the move");
    }

    function test_cannot_move_more_than_the_deposit() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(CoopVault.InsufficientDeposit.selector, 0.3 ether, 0.4 ether));
        vault.transferDeposit(ben, 0.4 ether);
    }
}
