/// A club member whose wallet is a contract: it keeps a tally of what it receives, so its
/// receive function needs more than a 2,300 gas stipend.
contract LockerSmartWallet {
    uint256 public received;

    function depositTo(LockerDeposits box, uint256 amount) external {
        box.deposit{value: amount}();
    }

    function withdrawFrom(LockerDeposits box, uint256 amount) external {
        box.withdraw(amount);
    }

    receive() external payable {
        received += msg.value;
    }
}

contract LockerExampleTest is Test {
    function test_example() public {
        address clubOwner = makeAddr("clubOwner");
        address ann = makeAddr("ann");
        vm.prank(clubOwner);
        LockerDeposits box = new LockerDeposits();

        vm.deal(ann, 1 ether);
        vm.prank(ann);
        box.deposit{value: 0.3 ether}();
        vm.prank(ann);
        box.withdraw(0.1 ether);
        assertEq(box.deposits(ann), 0.2 ether, "Ann's deposit after taking back 0.1 ether");

        LockerSmartWallet wallet = new LockerSmartWallet();
        vm.deal(address(wallet), 1 ether);
        wallet.depositTo(box, 0.5 ether);
        wallet.withdrawFrom(box, 0.5 ether);
        assertEq(address(wallet).balance, 1 ether, "the smart wallet's balance after depositing and withdrawing");

        vm.prank(clubOwner);
        box.close();
        assertEq(clubOwner.balance, 0.2 ether, "what the club received when the box was closed");
        vm.prank(ann);
        vm.expectRevert(LockerDeposits.Closed.selector);
        box.deposit{value: 0.1 ether}();
    }
}
