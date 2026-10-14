Write the classes and the function of `solution.py`. The tests also build their own subclasses
and combinations of your classes, so use `super()` wherever a step says so.

1. **`Ticket(visitor)`** stores `visitor`. It has the class attribute `BASE = 14.0`.
   - `price()` returns `self.BASE`.
   - `label()` returns `CLASSNAME VISITOR: PRICE`, with the name of the object's own class
     (`type(self).__name__`) and the price with two decimals: `Ticket Ana: 14.00`.
2. **`ChildTicket(Ticket)`** overrides `price()` to return half of what `super().price()`
   returns.
3. **`FamilyTicket(Ticket)`** is created as `FamilyTicket(visitor, adults, children)`: its
   `__init__` calls `super().__init__(visitor)` and stores `adults` and `children`. Its
   `price()` takes `full = super().price()` and returns
   `round((adults * full + children * full / 2) * 0.9, 2)`: the family pays 10% less.
4. **`MemberMixin`** is a mixin with no base class but `object` and no `__init__`. It defines
   only `price()`, which returns what `super().price()` returns less `3.0`, but never less than
   `0.0`. Then define **`MemberTicket`**, a ticket with the member discount, as a class with
   `MemberMixin` first and `Ticket` second as bases and nothing else in its body.
5. **`takings(tickets)`** returns the sum of `price()` of every item, rounded to 2 decimals.
   The items can be any objects with a `price()` method, not only tickets.

Example:

```python
Ticket("Ana").price()                   # 14.0
ChildTicket("Ben").label()              # 'ChildTicket Ben: 7.00'
FamilyTicket("Okafor", 2, 3).price()    # 44.1
MemberTicket("Ines").label()            # 'MemberTicket Ines: 11.00'


class MemberChildTicket(MemberMixin, ChildTicket):
    pass


MemberChildTicket("Leo").price()        # 4.0: 14.0 halved, then 3.0 off
takings([Ticket("Ana"), ChildTicket("Ben"), MemberChildTicket("Leo")])   # 25.0
```

**Tips.** Inside `MemberMixin.price`, `super()` is the next class in the MRO of the object, not
a parent of the mixin, which is how the same mixin discounts any kind of ticket. `label` calls
`self.price()`, so every subclass gets the right label without writing its own.
