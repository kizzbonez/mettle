# Payment: an ABC with one abstract method, fee, and a concrete charge built on it.
import abc

assert issubclass(Payment, abc.ABC), "Payment should derive from ABC"
assert getattr(Payment, "__abstractmethods__", frozenset()) == frozenset({"fee"}), "fee should be the only abstract method of Payment"


class Forgetful(Payment):
    def fees(self, amount):  # misspelt: fee is still abstract
        return 1


class Coupon(Payment):
    def fee(self, amount):
        return -amount // 10


for cls in (Payment, Forgetful):
    try:
        cls("broken")
    except TypeError:
        pass
    else:
        raise AssertionError(f"{cls.__name__} has no fee of its own, so creating one should raise TypeError")

coupon = Coupon("spring")
assert coupon.label == "spring", "Payment.__init__ stores the label"
assert coupon.charge(500) == 450, "charge adds whatever fee the subclass computes, even a negative one"
assert coupon.charge(0) == 0, "charge works for a bill of 0"
assert isinstance(coupon, Payment), "a subclass that defines fee is a Payment"
