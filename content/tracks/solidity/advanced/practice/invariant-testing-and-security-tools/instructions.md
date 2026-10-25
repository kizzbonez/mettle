`solution.sol` holds `MealCredits` (finished; do not change it), the `IMealCredits` interface it
implements, and `CreditsHandler`, the handler that the hidden invariant tests give to the fuzzer
with `targetContract(address(handler))`. `CreditsHandler` inherits forge-std's `Test`, so it can
use `vm` and `bound`. Its three actors, its ghost variables, its constructor and `buy` are
written; `buy` shows the pattern. Complete the rest:

1. **`give(uint256 fromSeed, uint256 toSeed, uint256 count)`**: the giver is
   `actors[fromSeed % 3]` and the receiver `actors[toSeed % 3]`. Do **not** skip the case where
   they are the same actor: the fuzzer must be able to try it. Bound `count` to between 0 and
   the giver's `creditsOf`, then call `credits.give` as the giver (`vm.prank`).
2. **`redeem(uint256 actorSeed, uint256 count)`**: the actor is `actors[actorSeed % 3]`; bound
   `count` to between 0 and its credits, call `credits.redeem` as the actor, and add `count` to
   `ghostRedeemed`.
3. **`refund(uint256 actorSeed, uint256 count)`**: the same, with `credits.refund` and
   `ghostRefunded`.
4. **`sumOfCredits()`** returns the credits the three actors hold, read with
   `credits.creditsOf`.

Rules the tests rely on: no handler function reverts, whatever its inputs; the ghosts count
only what the handler itself asked for, never values read from the contract's totals, so that
they disagree with a contract whose bookkeeping is wrong; and the handler never holds credits
itself.

```solidity
handler.buy(3, 5);       // actor 3 % 3 = 0 buys 5 credits; ghostBought() is 5
handler.give(0, 1, 2);   // actor 0 gives 2 to actor 1
handler.redeem(1, 1);    // actor 1 eats one meal; ghostRedeemed() is 1
handler.refund(0, 999);  // actor 0 refunds what it holds, 3 credits; ghostRefunded() is 3
handler.sumOfCredits();  // 1
```

The visible test also runs `invariant_credits_add_up`, so you can see how forge reports an
invariant run and which handler functions it called. The hidden tests run four invariants with
your handler, call it with wild inputs, and run it against two faulty versions of the contract:
one where a gift to yourself creates credits, and one whose refunds forget to lower the total.
