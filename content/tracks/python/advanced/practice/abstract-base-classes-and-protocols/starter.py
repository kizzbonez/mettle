# Café payments: an abstract base class and a protocol.
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable


# 1. Make Payment an abstract base class with an abstract fee().
class Payment:
    def __init__(self, label):
        self.label = label

    def fee(self, amount):
        # Abstract: each payment method defines its own fee.
        raise NotImplementedError("make fee abstract")

    def charge(self, amount):
        # The amount plus the fee.
        raise NotImplementedError("write charge")


# 2. Card (20 cents plus amount // 100, and a refund method) and Cash (no fee).
class Card(Payment):
    pass


class Cash(Payment):
    pass


# 3. Refundable: a runtime-checkable Protocol with refund(self, amount: int) -> str.
class Refundable:
    pass


# 4. The refund results of the payments that are Refundable, in order.
def refund_all(payments, amount):
    raise NotImplementedError("write refund_all")
