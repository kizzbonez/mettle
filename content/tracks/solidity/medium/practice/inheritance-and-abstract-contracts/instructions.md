The lathe's booking desk in `solution.sol` is built from layers. `Owned` and the abstract
`BookingDesk` are complete: `book(slot)` checks the slot is free and the fee is exact, then calls
the hook `_checkBooking(booker, slot)`, which does nothing in `BookingDesk`. Two abstract layers
add rules by overriding that hook, and `Woodshop` combines them. Write the four bodies marked
in the starter; keep every name and signature.

1. **`MembersOnly._checkBooking`** reverts with `NotMember(booker)` unless `isMember[booker]`,
   then calls `super._checkBooking(booker, slot)`.
2. **`SlotLimit._checkBooking`** reverts with `LimitReached(booker, maxSlots)` when the booker
   already holds `maxSlots` bookings (`slotsOf[booker]`). Otherwise it adds one to
   `slotsOf[booker]`, then calls `super._checkBooking(booker, slot)`. If a later rule reverts,
   the whole booking reverts, and the count with it.
3. **`Woodshop.fee()`** returns `FEE` (0.01 ether).
4. **`Woodshop._checkBooking`** must run both layers' rules. Each layer checks its own rule
   **before** calling `super`, so the rule that runs first is decided by `Woodshop`'s
   linearization (`contract Woodshop is MembersOnly, SlotLimit`).

Every layer must call `super`, even one that seems to be last: the tests also combine `MembersOnly`
and `SlotLimit` with layers of their own.

```solidity
Woodshop shop = new Woodshop(2);       // you are the owner; 2 slots per booker
shop.setMember(ada, true);
vm.prank(ada); shop.book{value: 0.01 ether}(1);   // Booked(ada, 1)
vm.prank(ada); shop.book{value: 0.01 ether}(2);   // slotsOf(ada) is now 2
vm.prank(ada); shop.book{value: 0.01 ether}(3);   // reverts with LimitReached(ada, 2)
vm.prank(bo);  shop.book{value: 0.01 ether}(3);   // reverts with NotMember(bo)
shop.setMember(ada, false);
vm.prank(ada); shop.book{value: 0.01 ether}(3);   // breaks both rules: LimitReached(ada, 2)
```

`SlotLimit` sits last in `is MembersOnly, SlotLimit`, so it is the closest base: `super` in
`Woodshop` reaches its rule first, and its `super` then reaches `MembersOnly`.
