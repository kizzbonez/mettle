`solution.sol` holds `CoopVault`, an OpenZeppelin `ERC721` that also keeps ether deposits. Two
of its functions make an external call before their state is up to date, and a member contract
can use that moment to call back in. Fix them so that every reentrant call fails or finds the
state already settled. Keep every name, error and event as declared.

The external calls are:

- the ether payment in `withdrawAll`, which runs the member's `receive()` or `fallback()`;
- `_safeMint` in `claimBadge`, which calls the member's `onERC721Received` when the member is a
  contract (Medium 05).

**Tasks**

1. **`withdrawAll()`** pays the caller their whole `depositOf` and emits
   `Withdrawn(member, amount)`; with nothing deposited it reverts with `NothingToWithdraw()`, and
   if the payment fails, with `PaymentFailed()`. While the payment runs, the member's deposit
   must already be zero, so that calling `withdrawAll` again finds nothing, and
   `transferDeposit` finds nothing to move (a **cross-function** reentrancy).
2. **`claimBadge()`** mints badge `nextBadgeId` to the caller and emits
   `BadgeClaimed(member, badgeId)`. It reverts with `DepositTooSmall(available, BADGE_MIN)` below
   `BADGE_MIN` and with `AlreadyClaimed()` for a second badge, also when the second claim comes
   from inside the caller's own `onERC721Received`.
3. Apply checks-effects-interactions in both functions. You may also add OpenZeppelin's guard,
   `import {ReentrancyGuardTransient} from
   "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";`, but a guard protects only
   the functions that carry `nonReentrant`: think about which ones a reentrant call can reach.

`deposit` and `transferDeposit` keep their behaviour: `transferDeposit(to, amount)` reverts with
`InsufficientDeposit(available, amount)` when `amount` is larger than the caller's deposit and
emits `DepositMoved(from, to, amount)`.

**Example**

```solidity
vault.deposit{value: 0.3 ether}();      // as Ada
vault.transferDeposit(ben, 0.1 ether);  // as Ada: Ben's deposit is 0.1 ether
vault.withdrawAll();                    // as Ben: pays him 0.1 ether, emits Withdrawn(ben, 0.1 ether)
vault.claimBadge();                     // as Ada: badge 1 is Ada's, emits BadgeClaimed(ada, 1)
vault.claimBadge();                     // as Ada again: reverts AlreadyClaimed()
```

The tests use member contracts: one whose `receive()` calls `withdrawAll()` again, one whose
`receive()` moves its deposit to a friend, and one whose `onERC721Received` claims again. Each
tries its call with `try ... {} catch {}`, and the tests then check that the vault still holds
every other member's ether and that each member has one badge.
