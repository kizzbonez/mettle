# load_prices, bill and read_orders called directly.
from decimal import Decimal

prices = load_prices("data/prices.json")
assert isinstance(prices, dict), "load_prices returns a dict"
assert set(prices) == {"coffee-1kg", "lentils-2kg", "oats-5kg", "olive-oil-1l", "rice-5kg"}, (
    "load_prices returns one entry per item of the price list's items object, and nothing else"
)
assert all(type(price) is Decimal for price in prices.values()), "load_prices returns every price as a Decimal"
assert prices["coffee-1kg"] == Decimal("17.85") and str(prices["oats-5kg"]) == "11.40", (
    "load_prices keeps each price exactly as written in the file"
)

for path, problem in [
    ("data/prices-comma.json", "a price written with a comma"),
    ("data/prices-float.json", "a price written as a JSON number instead of a string"),
    ("data/prices-broken.json", "a file that is not valid JSON"),
]:
    try:
        load_prices(path)
    except ValueError:
        pass
    except Exception as error:
        raise AssertionError(f"load_prices should raise ValueError for {problem}, not {type(error).__name__}")
    else:
        raise AssertionError(f"load_prices should raise ValueError for {problem}")

result = bill({"olive-oil-1l": 2}, prices, Decimal("5"))
assert isinstance(result, tuple) and len(result) == 3, "bill returns a tuple of three values"
assert all(type(value) is Decimal for value in result), "bill returns Decimal values"
assert result == (Decimal("16.50"), Decimal("0.83"), Decimal("17.33")), (
    "bill rounds a fee of exactly half a cent up, and adds it to the subtotal"
)

result = bill({"rice-5kg": 1, "coffee-1kg": 3}, prices, Decimal("2.5"))
assert result == (Decimal("63.54"), Decimal("1.59"), Decimal("65.13")), (
    "bill with several items and a fee percentage with decimals"
)
subtotal, fee, total = bill({"lentils-2kg": 7}, prices, Decimal("3"))
assert fee == fee.quantize(Decimal("0.01")), "bill rounds the fee to whole cents"
assert (subtotal, fee, total) == (Decimal("48.65"), Decimal("1.46"), Decimal("50.11")), (
    "bill rounds a fee that is not a tie to the nearest cent"
)
assert bill({"coffee-1kg": 1}, prices, Decimal("0")) == (Decimal("17.85"), 0, Decimal("17.85")), (
    "bill with a fee of 0 percent"
)
assert bill({}, prices, Decimal("5")) == (0, 0, 0), "bill with no items returns zeros"

orders = read_orders("data/orders.csv", prices)
assert orders == {
    "Ana": {"oats-5kg": 3, "lentils-2kg": 3},
    "Ben": {"coffee-1kg": 1},
    "Chloe": {"olive-oil-1l": 2},
    "Dev": {"rice-5kg": 4, "olive-oil-1l": 1},
}, "read_orders returns each member's valid items with the quantities added up, members and items stripped"
assert all(type(quantity) is int for items in orders.values() for quantity in items.values()), (
    "read_orders stores quantities as int"
)
