// A crew's contract wallet that keeps a count of the payments it receives (a storage write,
// which needs more than the 2300 gas that transfer and send pass on).
contract CrewWallet {
    uint256 public paymentsReceived;

    function deposit(SavingsJar jar) external payable {
        jar.save{value: msg.value}();
    }

    function takeOut(SavingsJar jar, uint256 amount) external {
        jar.withdraw(amount);
    }

    receive() external payable {
        paymentsReceived += 1;
    }
}

// A member contract that cannot receive ether at all.
contract SealedMember {
    function deposit(SavingsJar jar) external payable {
        jar.save{value: msg.value}();
    }

    function takeOut(SavingsJar jar, uint256 amount) external {
        jar.withdraw(amount);
    }
}

contract RecipientsTest is Test {
    SavingsJar jar;

    function setUp() public {
        jar = new SavingsJar();
    }

    function test_pays_a_wallet_whose_receive_writes_storage() public {
        CrewWallet wallet = new CrewWallet();
        wallet.deposit{value: 1 ether}(jar);
        wallet.takeOut(jar, 0.4 ether);

        assertEq(address(wallet).balance, 0.4 ether, "ether received by the crew wallet");
        assertEq(wallet.paymentsReceived(), 1, "payments counted by the crew wallet");
        assertEq(jar.savedBy(address(wallet)), 0.6 ether, "the crew wallet's savings left");
    }

    function test_a_failed_payment_reverts_and_keeps_the_savings() public {
        SealedMember member = new SealedMember();
        member.deposit{value: 1 ether}(jar);

        vm.expectRevert(abi.encodeWithSelector(SavingsJar.TransferFailed.selector, address(member), 0.5 ether));
        member.takeOut(jar, 0.5 ether);

        assertEq(jar.savedBy(address(member)), 1 ether, "savings after a failed payment");
        assertEq(jar.totalSaved(), 1 ether, "total savings after a failed payment");
        assertEq(address(jar).balance, 1 ether, "ether held after a failed payment");
    }
}
