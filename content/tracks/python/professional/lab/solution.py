"""coop: monthly bulk-order totals and invoices for the Riverside Food Co-op."""
import argparse
import csv
import json
import logging
import sys
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

logger = logging.getLogger("coop")

CENT = Decimal("0.01")


def load_prices(path):
    """Return the price list in PATH as a dict of item id to Decimal price."""
    with open(path, encoding="utf-8") as file:
        document = json.load(file)  # json.JSONDecodeError is a ValueError
    items = document.get("items") if isinstance(document, dict) else None
    if not isinstance(items, dict):
        raise ValueError('the price list has no "items" object')
    prices = {}
    for item, text in items.items():
        if not isinstance(text, str):
            raise ValueError(f"the price of {item!r} must be a string, such as \"9.99\"")
        try:
            price = Decimal(text)
        except InvalidOperation:
            raise ValueError(f"the price of {item!r} is not a number: {text!r}") from None
        if not price.is_finite() or price < 0:
            raise ValueError(f"the price of {item!r} must not be negative: {text!r}")
        prices[item] = price
    return prices


def read_orders(path, prices):
    """Return member -> {item id: total quantity} for the valid lines of the order file."""
    orders = {}
    with open(path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            line = reader.line_num
            member = (row.get("member") or "").strip()
            item = (row.get("item") or "").strip()
            quantity_text = (row.get("quantity") or "").strip()
            if not member:
                logger.warning("line %d: missing member", line)
                continue
            if item not in prices:
                logger.warning("line %d: unknown item %r", line, item)
                continue
            try:
                quantity = int(quantity_text)
            except ValueError:
                quantity = 0
            if quantity < 1:
                logger.warning("line %d: bad quantity %r", line, quantity_text)
                continue
            items = orders.setdefault(member, {})
            items[item] = items.get(item, 0) + quantity
    return orders


def bill(items, prices, fee_percent):
    """Return (subtotal, fee, total) for one member's items; the fee is rounded half up to cents."""
    subtotal = sum((prices[item] * quantity for item, quantity in items.items()), Decimal("0"))
    fee = (subtotal * fee_percent / 100).quantize(CENT, rounding=ROUND_HALF_UP)
    return subtotal, fee, subtotal + fee


def fee_percent(text):
    """argparse type for --fee: a number from 0 to 100."""
    try:
        value = Decimal(text)
    except InvalidOperation:
        raise argparse.ArgumentTypeError(f"not a number: {text!r}") from None
    if not value.is_finite() or not 0 <= value <= 100:
        raise argparse.ArgumentTypeError(f"must be from 0 to 100: {text!r}")
    return value


def money(amount):
    return f"{amount:.2f}"


def print_totals(orders, prices, fee):
    writer = csv.writer(sys.stdout, lineterminator="\n")
    writer.writerow(["member", "subtotal", "fee", "total"])
    sums = [Decimal("0"), Decimal("0"), Decimal("0")]
    for member in sorted(orders):
        amounts = bill(orders[member], prices, fee)
        writer.writerow([member, *(money(amount) for amount in amounts)])
        sums = [running + amount for running, amount in zip(sums, amounts)]
    writer.writerow(["TOTAL", *(money(amount) for amount in sums)])


def print_invoice(member, items, prices, fee):
    print(f"Invoice for {member}")
    for item in sorted(items):
        quantity = items[item]
        price = prices[item]
        print(f"{item} {quantity} x {money(price)} = {money(price * quantity)}")
    subtotal, fee_amount, total = bill(items, prices, fee)
    print(f"Subtotal: {money(subtotal)}")
    print(f"Fee: {money(fee_amount)}")
    print(f"Total: {money(total)}")


def build_parser():
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--orders", default="data/orders.csv", help="order CSV file")
    common.add_argument("--prices", default="data/prices.json", help="price list JSON file")
    common.add_argument("--fee", type=fee_percent, default=Decimal("5"),
                        help="handling fee in percent (default: 5)")
    parser = argparse.ArgumentParser(prog="coop", description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("totals", parents=[common], help="one CSV line per member")
    invoice = commands.add_parser("invoice", parents=[common], help="one member's invoice")
    invoice.add_argument("member")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    logging.basicConfig(format="%(levelname)s: %(message)s")
    try:
        prices = load_prices(args.prices)
        orders = read_orders(args.orders, prices)
    except OSError as error:
        logger.error("cannot read a file: %s", error)
        return 1
    except ValueError as error:
        logger.error("bad price list %s: %s", args.prices, error)
        return 1
    if args.command == "totals":
        print_totals(orders, prices, args.fee)
        return 0
    member = args.member.strip()
    if member not in orders:
        logger.error("no orders for %s", member)
        return 1
    print_invoice(member, orders[member], prices, args.fee)
    return 0


if __name__ == "__main__":
    sys.exit(main())
