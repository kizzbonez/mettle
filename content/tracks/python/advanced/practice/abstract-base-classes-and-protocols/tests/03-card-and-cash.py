# Card and Cash: their fees at the rounding boundaries, and which one refunds.
card = Card("mastercard")
cash = Cash("drawer")
assert isinstance(card, Payment) and isinstance(cash, Payment), "Card and Cash are subclasses of Payment"
assert card.label == "mastercard" and cash.label == "drawer", "Card and Cash keep their labels"

for amount, fee in [(0, 20), (99, 20), (100, 21), (150, 21), (199, 21), (1250, 32), (10000, 120)]:
    assert card.fee(amount) == fee, f"the card fee for a bill of {amount} cents"
    assert card.charge(amount) == amount + fee, f"a card charge for a bill of {amount} cents"
for amount in (0, 1, 999):
    assert cash.fee(amount) == 0 and cash.charge(amount) == amount, f"cash adds no fee to a bill of {amount} cents"

assert card.refund(450) == "refunded 450 to mastercard", "Card.refund names the amount and the card's label"
assert Card("Ünïcard").refund(1) == "refunded 1 to Ünïcard", "the refund message uses the label as given"
assert not hasattr(cash, "refund"), "Cash has no refund method"
