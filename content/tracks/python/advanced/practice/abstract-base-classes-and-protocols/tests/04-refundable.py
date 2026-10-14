# Refundable: a runtime-checkable protocol, and refund_all built on isinstance with it.
import typing

assert typing.is_protocol(Refundable), "Refundable should be a typing.Protocol"
assert typing.get_protocol_members(Refundable) == frozenset({"refund"}), "Refundable should require exactly one member, refund"
try:
    Refundable()
except TypeError:
    pass
else:
    raise AssertionError("a protocol cannot be instantiated, so Refundable() should raise TypeError")


class Wallet:
    def __init__(self):
        self.calls = []

    def refund(self, amount):
        self.calls.append(amount)
        return f"wallet +{amount}"


class Tab:
    def pay(self, amount):
        return amount


try:
    checks = [isinstance(Card("v"), Refundable), isinstance(Wallet(), Refundable),
              isinstance(Cash("c"), Refundable), isinstance(Tab(), Refundable), isinstance("refund", Refundable)]
except TypeError:
    raise AssertionError("isinstance with Refundable needs @runtime_checkable")
assert checks == [True, True, False, False, False], "isinstance with Refundable checks only for a refund method"

wallet = Wallet()
assert refund_all([], 100) == [], "no payments give no refunds"
assert refund_all([Cash("a"), Tab(), Cash("b")], 100) == [], "payments without refund are skipped"
assert refund_all([wallet, Cash("a"), Card("amex"), wallet], 75) == ["wallet +75", "refunded 75 to amex", "wallet +75"], "refund_all keeps the order of the payments"
assert wallet.calls == [75, 75], "refund_all calls refund once per Refundable payment, with the amount"
