# Bike rental records: an enum, a named tuple and a dataclass.
from dataclasses import dataclass, field
from enum import StrEnum, auto
from typing import NamedTuple


class Size(StrEnum):
    SMALL = auto()
    MEDIUM = auto()
    LARGE = auto()


class Bike(NamedTuple):
    code: str
    size: Size
    electric: bool = False


@dataclass
class Rental:
    customer: str
    hours: int = 1
    bikes: list[Bike] = field(default_factory=list)

    def __post_init__(self):
        if not self.customer.strip():
            raise ValueError("a rental needs a customer name")
        if not 1 <= self.hours <= 24:
            raise ValueError(f"hours must be between 1 and 24, got {self.hours}")

    def price(self):
        per_hour = sum(15 if bike.electric else 8 for bike in self.bikes)
        return per_hour * self.hours
