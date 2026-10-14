# Café payments: an abstract base class and a protocol.
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable


class Payment(ABC):
    def __init__(self, label):
        self.label = label

    @abstractmethod
    def fee(self, amount):
        """Return the fee added to a bill of amount cents."""

    def charge(self, amount):
        return amount + self.fee(amount)


class Card(Payment):
    def fee(self, amount):
        return 20 + amount // 100

    def refund(self, amount):
        return f"refunded {amount} to {self.label}"


class Cash(Payment):
    def fee(self, amount):
        return 0


@runtime_checkable
class Refundable(Protocol):
    def refund(self, amount: int) -> str: ...


def refund_all(payments, amount):
    return [payment.refund(amount) for payment in payments if isinstance(payment, Refundable)]
