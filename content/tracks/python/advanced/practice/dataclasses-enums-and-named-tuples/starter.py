# Bike rental records: an enum, a named tuple and a dataclass.
from dataclasses import dataclass, field
from enum import StrEnum, auto
from typing import NamedTuple


# 1. Size: a StrEnum with SMALL, MEDIUM and LARGE, values from auto().
class Size:
    pass


# 2. Bike: a NamedTuple with code: str, size: Size and electric: bool = False.
class Bike:
    pass


# 3. Rental: a dataclass with customer: str, hours: int = 1 and bikes: list[Bike]
#    (a new empty list by default). Validate in __post_init__ and add price().
class Rental:
    def price(self):
        # 8 euros per bike per hour, 15 for an electric bike.
        raise NotImplementedError("write price")
