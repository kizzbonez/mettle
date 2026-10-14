# The café example from the instructions.
card, cash = Card("visa"), Cash("till")
assert card.charge(1250) == 1282, "a card adds 20 cents plus 1 % of the amount"
assert cash.charge(1250) == 1250, "cash adds no fee"

try:
    Payment("x")
except TypeError:
    pass
else:
    raise AssertionError("Payment is abstract, so Payment('x') should raise TypeError")


class GiftVoucher:
    def refund(self, amount):
        return f"voucher for {amount}"


assert isinstance(GiftVoucher(), Refundable), "a class with a refund method is Refundable without inheriting anything"
assert not isinstance(cash, Refundable), "Cash has no refund method, so it is not Refundable"
assert refund_all([card, cash, GiftVoucher()], 300) == ["refunded 300 to visa", "voucher for 300"], "refund_all refunds every Refundable payment in order"
