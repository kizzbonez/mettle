// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

/// @notice The astronomy society's membership list.
interface IMembers {
    function isMember(address who) external view returns (bool);
}

/// @notice Members borrow a telescope for a week against a deposit. A late return costs a fee
/// for every started day, never more than the whole deposit. Finished: do not change it.
contract TelescopeLoans {
    uint256 public constant DEPOSIT = 0.2 ether;
    uint256 public constant LOAN_PERIOD = 7 days;
    uint256 public constant FEE_PER_DAY = 0.01 ether;

    struct Loan {
        address borrower;
        uint64 dueAt;
    }

    IMembers public immutable members;
    mapping(uint256 scope => Loan) public loans;
    uint256 public feesCollected;

    event Borrowed(uint256 indexed scope, address indexed borrower, uint256 dueAt);
    event Returned(uint256 indexed scope, address indexed borrower, uint256 fee);

    error NotMember(address who);
    error WrongDeposit(uint256 sent);
    error OnLoan(uint256 scope);
    error NotOnLoan(uint256 scope);
    error NotBorrower(address caller);
    error RefundFailed();

    constructor(IMembers members_) {
        members = members_;
    }

    /// @notice Borrow telescope `scope` for LOAN_PERIOD, paying exactly DEPOSIT.
    function borrow(uint256 scope) external payable {
        if (!members.isMember(msg.sender)) revert NotMember(msg.sender);
        if (msg.value != DEPOSIT) revert WrongDeposit(msg.value);
        if (loans[scope].borrower != address(0)) revert OnLoan(scope);
        uint256 dueAt = block.timestamp + LOAN_PERIOD;
        loans[scope] = Loan(msg.sender, uint64(dueAt));
        emit Borrowed(scope, msg.sender, dueAt);
    }

    /// @notice The fee for a return at `returnedAt`: FEE_PER_DAY for every started day after
    /// `dueAt`, capped at DEPOSIT.
    function lateFee(uint256 dueAt, uint256 returnedAt) public pure returns (uint256) {
        if (returnedAt <= dueAt) return 0;
        uint256 daysLate = (returnedAt - dueAt + 1 days - 1) / 1 days;
        uint256 fee = daysLate * FEE_PER_DAY;
        return fee < DEPOSIT ? fee : DEPOSIT;
    }

    /// @notice Give telescope `scope` back and get the deposit minus any late fee.
    function giveBack(uint256 scope) external {
        Loan memory loan = loans[scope];
        if (loan.borrower == address(0)) revert NotOnLoan(scope);
        if (msg.sender != loan.borrower) revert NotBorrower(msg.sender);
        uint256 fee = lateFee(loan.dueAt, block.timestamp);
        delete loans[scope];
        feesCollected += fee;
        emit Returned(scope, msg.sender, fee);
        (bool ok,) = msg.sender.call{value: DEPOSIT - fee}("");
        if (!ok) revert RefundFailed();
    }
}

/// @notice The tests for TelescopeLoans. The checks run each test against the real contract,
/// where it must pass, and against a copy with one bug, where it must fail.
contract TelescopeLoansTest is Test {
    TelescopeLoans public rental;
    address public members = makeAddr("members");
    address public alice = makeAddr("alice");
    address public stranger = makeAddr("stranger");

    function setUp() public {
        // The membership list answers "yes" for every address unless a test says otherwise.
        vm.mockCall(members, abi.encodeWithSelector(IMembers.isMember.selector), abi.encode(true));
        rental = new TelescopeLoans(IMembers(members));
    }

    /// @dev Catches a giveBack that forgets to check who is giving the telescope back.
    function test_stranger_cannot_give_back() public {
        hoax(alice, 1 ether);
        rental.borrow{value: 0.2 ether}(1);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(TelescopeLoans.NotBorrower.selector, stranger));
        rental.giveBack(1);
    }

    /// @dev Catches a borrow that forgets to ask the membership list.
    function test_non_member_cannot_borrow() public {
        // A more specific mock wins over setUp's selector-only one.
        vm.mockCall(members, abi.encodeCall(IMembers.isMember, (stranger)), abi.encode(false));
        hoax(stranger, 1 ether);
        vm.expectRevert(abi.encodeWithSelector(TelescopeLoans.NotMember.selector, stranger));
        rental.borrow{value: 0.2 ether}(1);
    }

    /// @dev Catches a fee charged when the telescope comes back exactly on time.
    function test_return_at_the_due_second_is_free() public {
        hoax(alice, 1 ether);
        rental.borrow{value: 0.2 ether}(1);
        (, uint64 dueAt) = rental.loans(1);

        vm.warp(dueAt); // the last second that is still on time
        vm.prank(alice);
        rental.giveBack(1);

        assertEq(alice.balance, 1 ether, "alice's balance after an on-time return");
        assertEq(rental.feesCollected(), 0, "the fees after an on-time return");
    }

    /// @dev Catches a late fee that can grow beyond the deposit.
    function testFuzz_refund_and_fee_add_up_to_the_deposit(uint256 lateBy) public {
        lateBy = bound(lateBy, 0, 60 days);
        hoax(alice, 1 ether);
        rental.borrow{value: 0.2 ether}(1);
        (, uint64 dueAt) = rental.loans(1);
        uint256 afterBorrowing = alice.balance;

        vm.warp(dueAt + lateBy);
        vm.prank(alice);
        rental.giveBack(1);

        uint256 refund = alice.balance - afterBorrowing;
        assertEq(refund + rental.feesCollected(), rental.DEPOSIT(), "the refund plus the fee");
        assertLe(rental.feesCollected(), rental.DEPOSIT(), "the fee compared with the deposit");
    }
}
