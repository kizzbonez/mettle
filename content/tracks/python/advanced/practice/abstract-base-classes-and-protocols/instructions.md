Amounts are whole cents. Write in `solution.py`:

1. `Payment`, an abstract base class (derive from `ABC`).
   - `__init__(self, label)` stores `label`.
   - `fee(self, amount)` is an **abstract method**: every payment method must say what fee it
     adds to a bill of `amount` cents. `Payment("x")`, or a subclass that does not define `fee`,
     cannot be created (`TypeError`).
   - `charge(self, amount)` is a concrete method: it returns `amount` plus `self.fee(amount)`.
2. Two subclasses of `Payment`:
   - `Card`: the fee is 20 cents plus 1 % of the amount rounded down (`amount // 100`). It also
     has `refund(self, amount)`, which returns the string `f"refunded {amount} to {self.label}"`.
   - `Cash`: the fee is 0. It has no `refund` method.
3. `Refundable`, a `typing.Protocol` with one method, `refund(self, amount: int) -> str`, marked
   `@runtime_checkable` so `isinstance` can be used with it.
4. `refund_all(payments, amount)` returns a list with the result of `refund(amount)` for every
   payment that is `Refundable`, in order, skipping the others. Any object with a `refund`
   method counts, even if it does not inherit from `Payment`.

Example:

```python
card, cash = Card("visa"), Cash("till")
card.charge(1250), cash.charge(1250)   # (1282, 1250): the card fee is 20 + 12
Payment("x")                           # TypeError: Can't instantiate abstract class Payment ...


class GiftVoucher:                     # inherits from nothing
    def refund(self, amount):
        return f"voucher for {amount}"


isinstance(GiftVoucher(), Refundable), isinstance(cash, Refundable)   # (True, False)
refund_all([card, cash, GiftVoucher()], 300)
# ['refunded 300 to visa', 'voucher for 300']
```
