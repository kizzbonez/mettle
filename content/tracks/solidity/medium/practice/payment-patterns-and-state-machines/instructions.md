Complete `MuralPot` in `solution.sol`. Its state, events, errors, constructor and the `_send`
helper are written; so are the function headers, with their modifiers in the right order
(`timedTransitions` before `atStage`). Write the bodies.

The pot has three stages: `Pledging`, then `Funded` or `Failed`. It stays in `Pledging` while
`block.timestamp < deadline`. From the first call at or after the deadline it is `Funded` if
`totalPledged >= goal`, otherwise `Failed`.

1. **`modifier timedTransitions()`**: if the stage is `Pledging` and `block.timestamp >= deadline`,
   call `_finish()`; then run the body (`_;`).
2. **`modifier atStage(Stage expected)`**: revert with `WrongStage(expected, stage)` unless `stage`
   is `expected`; then run the body.
3. **`pledge()`** (payable): revert with `ZeroPledge()` when `msg.value` is 0. Otherwise add the
   value to `pledged[msg.sender]` and to `totalPledged`, and emit `Pledged(msg.sender, msg.value)`.
   After the deadline the modifiers make it revert with `WrongStage(Pledging, <the new stage>)`.
4. **`finish()`**: lets anyone close pledging. After `timedTransitions` has run, revert with
   `TooEarly(deadline)` if the stage is still `Pledging`. After the deadline it does nothing more.
5. **`refund()`**, in a failed pot: a backer takes back their pledge. Revert with
   `NothingToWithdraw(msg.sender)` if they have nothing pledged. Otherwise set their `pledged` to
   0 **first**, then `_send` them the amount.
6. **`withdraw()`**, in a funded pot: a painter takes their share. Revert with
   `NothingToWithdraw(msg.sender)` if `owed[msg.sender]` is 0. Otherwise set it to 0 **first**,
   then `_send` them the amount.
7. **`_finish()`**: the next stage is `Funded` if `totalPledged >= goal`, otherwise `Failed`. Emit
   `StageChanged(stage, next)` and store `next`. For `Funded`, credit every painter
   `totalPledged / painters.length` in `owed`, and give the lead painter, `painters[0]`, the
   remainder (`totalPledged % painters.length`) as well. Send no ether here.

Rules the tests check: a painter or backer whose wallet refuses ether must only fail their own
withdrawal; a wallet that calls `withdraw` again while being paid must get nothing more; the
painters' shares must add up to exactly `totalPledged`.

**Worked example** (the visible test). Three painters, `lead`, `bo` and `cy`, a goal of 1 ether
and a deadline 30 days away. Ana pledges 0.4 ether, Ben 0.35 ether and Dee 0.25 ether plus 1 wei,
so `totalPledged` is 1 ether + 1 wei. At the deadline:

```solidity
vm.warp(deadline);
pot.finish(); // emits StageChanged(Pledging, Funded)
pot.owed(lead); // 333333333333333335: a third, plus the remainder of 2 wei
pot.owed(bo); // 333333333333333333, and the same for cy
```

Each painter then calls `withdraw()`, and the pot is left with 0 wei. One second before the
deadline a pledge is still accepted; at the deadline it reverts with `WrongStage(0, 1)` here
(`Pledging` expected, `Funded` found), and the stored stage stays `Pledging` because the
revert undoes the transition.
