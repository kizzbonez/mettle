/// A smart contract wallet whose receive function writes to storage.
contract LockerTallyWallet {
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

/// Code an EOA delegates to with EIP-7702: batches calls, accepts ether.
contract LockerBatchDelegate {
    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    function execute(Call[] calldata calls) external payable {
        require(msg.sender == address(this), "only the account itself");
        for (uint256 i = 0; i < calls.length; i++) {
            (bool ok, bytes memory reason) = calls[i].to.call{value: calls[i].value}(calls[i].data);
            if (!ok) {
                assembly ("memory-safe") {
                    revert(add(reason, 32), mload(reason))
                }
            }
        }
    }

    receive() external payable {}
}

contract LockerSmartAccountsTest is Test {
    LockerDeposits box;

    function setUp() public {
        vm.prank(makeAddr("clubOwner"));
        box = new LockerDeposits();
    }

    function test_a_contract_wallet_deposits_and_is_paid() public {
        LockerTallyWallet wallet = new LockerTallyWallet();
        vm.deal(address(wallet), 1 ether);
        wallet.depositTo(box, 0.6 ether);
        assertEq(box.deposits(address(wallet)), 0.6 ether, "a contract wallet's deposit");
        wallet.withdrawFrom(box, 0.6 ether);
        assertEq(wallet.received(), 0.6 ether, "what the contract wallet's receive function counted");
    }

    function test_a_delegated_eoa_batches_a_deposit_and_two_withdrawals() public {
        (address bea, uint256 beaKey) = makeAddrAndKey("bea");
        vm.deal(bea, 1 ether);
        vm.signAndAttachDelegation(address(new LockerBatchDelegate()), beaKey);

        LockerBatchDelegate.Call[] memory calls = new LockerBatchDelegate.Call[](3);
        calls[0] = LockerBatchDelegate.Call(address(box), 1 ether, abi.encodeCall(LockerDeposits.deposit, ()));
        calls[1] = LockerBatchDelegate.Call(address(box), 0, abi.encodeCall(LockerDeposits.withdraw, (0.4 ether)));
        calls[2] = LockerBatchDelegate.Call(address(box), 0, abi.encodeCall(LockerDeposits.withdraw, (0.6 ether)));
        vm.prank(bea, bea);
        LockerBatchDelegate(payable(bea)).execute(calls); // one transaction

        assertEq(box.deposits(bea), 0, "Bea's deposit after the batch");
        assertEq(bea.balance, 1 ether, "Bea's balance after the batch");
    }
}
