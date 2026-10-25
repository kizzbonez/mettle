This time you write the tests, not the contract. `solution.sol` holds the finished
`TelescopeLoans` contract (do not change it) and a test contract, `TelescopeLoansTest is Test`,
with a written `setUp` and four empty tests. Write the four test bodies; keep their names and
`setUp`.

**How your tests are checked.** A good test passes on correct code and fails on broken code.
The checks deploy your `TelescopeLoansTest`, call `setUp`, and run each of your tests twice:
once against the real contract, where it must pass, and once against a copy of the contract
with one bug, where it must fail. Which bug each test must catch:

| Your test | It must fail against a copy that... |
| --- | --- |
| `test_stranger_cannot_give_back` | lets anyone give a telescope back (and take the deposit) |
| `test_non_member_cannot_borrow` | lends to people who are not members |
| `test_return_at_the_due_second_is_free` | charges a day's fee at the due second itself |
| `testFuzz_refund_and_fee_add_up_to_the_deposit` | has no cap on the late fee |

What `setUp` gives you: `rental` (the contract), `members` (the address of the membership list,
mocked so that it answers `true` for everyone), and two labelled actors, `alice` and `stranger`,
made with `makeAddr`. The deposit is `rental.DEPOSIT()`, 0.2 ether. Each check starts at the
timestamp 1,000,000.

1. **`test_stranger_cannot_give_back()`**: `alice` borrows telescope 1 (use `hoax(alice, 1 ether)`
   and pay exactly 0.2 ether). Then, as `stranger`, expect exactly
   `TelescopeLoans.NotBorrower(stranger)` (selector and argument) and call `rental.giveBack(1)`.
2. **`test_non_member_cannot_borrow()`**: make the membership list answer `false` for `stranger`
   only, with `vm.mockCall(members, abi.encodeCall(IMembers.isMember, (stranger)), abi.encode(false))`
   (a mock with full calldata wins over `setUp`'s selector-only one). Give `stranger` ether and,
   as `stranger`, expect exactly `NotMember(stranger)` from `rental.borrow{value: 0.2 ether}(1)`.
3. **`test_return_at_the_due_second_is_free()`**: `alice` borrows telescope 1 with
   `hoax(alice, 1 ether)`. Read the due time with `(, uint64 dueAt) = rental.loans(1);`, warp to
   exactly `dueAt`, and give the telescope back as `alice`. Assert that `alice.balance` is
   1 ether again and that `rental.feesCollected()` is 0.
4. **`testFuzz_refund_and_fee_add_up_to_the_deposit(uint256 lateBy)`**: bound `lateBy` to
   `0` to `60 days` with `bound`. `alice` borrows telescope 1; remember her balance after paying.
   Warp to `dueAt + lateBy` and give the telescope back as `alice`. Assert that her refund (her
   balance now minus her balance after paying) plus `rental.feesCollected()` equals the deposit,
   and that `feesCollected()` is at most the deposit (`assertLe`).

Give every assertion a message, as always.

**Worked example.** Against the real contract, a telescope due at 1,604,800 (one week after
1,000,000) and returned at 1,604,801 is one second late, which starts a day: the fee is
0.01 ether, the refund 0.19 ether, and the two add up to the deposit. Against the copy without
a cap, a return 40 days late makes a fee of 0.4 ether, more than the deposit, so `giveBack`
fails with an arithmetic panic: your fuzz test fails on that copy, which is exactly what it must
do.

**Tips.** Read the values a call needs before `vm.prank`: a prank is used up by the very next
call, even a getter. A bare `vm.expectRevert()` accepts any failure, including "alice has no
ether", so it would let the broken copies pass. Run with *Run* first: the visible test runs your
tests against the real contract and shows their own messages.
