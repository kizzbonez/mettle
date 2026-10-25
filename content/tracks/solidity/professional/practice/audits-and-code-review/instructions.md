`solution.sol` starts as the `BursaryPool` code that was audited. Below are the four findings from
the review. Fix every one in `solution.sol`, keeping the contract's interface, events and errors
as they are. The hidden tests include the auditors' proofs of concept, which must now fail, and
checks that honest donors, the committee and students can still do everything they could before.

**H-01 (High): anyone can award bursaries.** `award` does not check its caller, so anyone can
award themselves everything in the pool and claim it. *Recommendation:* only `committee` may
create awards; anyone else gets `NotCommittee(msg.sender)`. Check every function that creates
awards, not only the one named here.

**H-02 (High): reentrancy in `claim` drains other students' awards.** `claim` pays before it
clears the award, so a student whose wallet is a contract can call `claim` again from its
`receive` function and be paid again, for as long as other students' unclaimed awards keep
`totalAwarded` from underflowing. *Recommendation:* follow checks-effects-interactions: clear the
award and lower `totalAwarded` (and emit `Claimed`) before sending the ether. A reentrant call
then reverts with `NothingToClaim()`.

**M-01 (Medium): `awardEqually` locks the remainder of its division.** Splitting 100 wei among
three students gives each 33 wei but adds 100 to `totalAwarded`. The extra wei can never be
claimed or awarded again. *Recommendation:* add only what was handed out,
`share * students.length`, so the remainder stays in `available()`.

**L-01 (Low): `setCommittee` changes a key role silently and accepts the zero address.**
*Recommendation:* revert with `ZeroAddress()` for `address(0)`, and emit
`CommitteeChanged(previousCommittee, next)` before storing the new committee. Only `owner` may
call it, as now.

After the fixes:

```solidity
BursaryPool pool = new BursaryPool(committee); // the deployer is the owner
pool.donate{value: 10 ether}();
// as committee
pool.award(ann, 3 ether);                      // available() is now 7 ether
// as ann
pool.claim();                                  // Ann receives 3 ether; totalAwarded() is 0
// as mallory
pool.award(mallory, 7 ether);                  // reverts with NotCommittee(mallory)
// as committee, with three students
pool.awardEqually(students, 100);              // 33 wei each; totalAwarded() grows by 99
```
